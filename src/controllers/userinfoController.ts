// src/controllers/userinfoController.ts
import { RequestHandler } from "express";
import { fetchUserInfoProfilesByKeyword } from "./authController";

export const getUserInfo: RequestHandler = async (req, res, next) => {
  try {
    const keyword = String(req.query.keyword || "");
    if (!keyword) {
      res.status(400).json({ message: "Missing keyword" });
      return;
    }

    // upstream returns e.g. [{ id, name, email, positionName }]
    const raw = await fetchUserInfoProfilesByKeyword(keyword);

    // map to a flat shape for the client
    const profiles = raw.map((p: any) => ({
      id:           p.id,
      email:        p.email,
      name:         p.employeeName?.th || p.employeeName?.en || p.name,
      position:     p.position?.name.th || p.position?.name.en || p.positionName,
    }));

    res.json(profiles);
  } catch (err) {
    next(err);
  }
};
