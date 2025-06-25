// authController.ts
import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import axios from "axios";

async function fetchAzureToken() {
  const res = await axios.post(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id:     process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope:         process.env.AZURE_SCOPE!,
      grant_type:    "client_credentials",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data.access_token as string;
}

async function fetchUserInfoProfile(email: string, password: string, azureToken: string) {
  // authenticate
  await axios.post(
    `https://${process.env.SERVICE_HOST}/userinfo/api/v2/authen`,
    { email, password },
    {
      headers: {
        Authorization: `Bearer ${azureToken}`,
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
        "Content-Type": "application/json",
      },
    }
  );

  // fetch profile
  const profileRes = await axios.post(
    `https://${process.env.SERVICE_HOST}/userinfo/api/v2/profile`,
    { email },
    {
      headers: {
        Authorization: `Bearer ${azureToken}`,
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SUBSCRIPTION_KEY!,
        "Content-Type": "application/json",
      },
    }
  );
  const result = profileRes.data.result?.[0];
  if (!result) throw new Error("No profile returned");
  return result;
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Get an AAD token and verify credentials upstream
    const azureToken = await fetchAzureToken();
    const profile    = await fetchUserInfoProfile(email, password, azureToken);

    // 2) Find (or upsert) your local user by employeeNumber
    const empNo = String(profile.id);
    const [deptEn, posEn, posTh] = [
      profile.department?.name.en,
      profile.position?.name.en,
      profile.position?.name.th,
    ];
    if (!deptEn || !posEn || !posTh) {
      res.status(500).json({ message: "Incomplete profile data" });
      return;
    }

    // determine role…
    let role: "USER"|"MANAGER"|"INSURANCE" = "USER";
    if (/Insurance Officer/i.test(posEn) && /Insurance/i.test(deptEn)) {
      role = "INSURANCE";
    } else if (/Manager/i.test(posEn) && /Insurance/i.test(deptEn)) {
      role = "MANAGER";
    }
    const name = profile.employeeName?.th ?? profile.employeeName?.en ?? "Unknown";

    // upsert local record
    const user = await prisma.user.upsert({
      where: { employeeNumber: empNo },
      create: {
        name,
        email,
        role,
        position: posTh,
        employeeNumber: empNo,
      },
      update: {
        email,
        //role,
        position: posTh,
      },
    });
     if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    // 3) issue your own JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, employeeNumber: empNo,name:user.name },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    res.json({ user, token });
    // Do not return any value from the handler
  } catch (err: any) {
    next(err);
  }
};
