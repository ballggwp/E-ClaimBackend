// src/controllers/userinfoController.ts
import { RequestHandler } from 'express'
import { fetchUserInfoProfile } from './authController'

export const getUserInfo: RequestHandler = async (req, res, next) => {
  try {
    const email = req.query.email as string
    if (!email) {
      // send a 400 and then bail out—not returning the Response object
      res.status(400).json({ message: 'Missing email' })
      return
    }

    const profile = await fetchUserInfoProfile(email)
    // send the profile, then exit
    res.json(profile)
    return
  } catch (err) {
    next(err)
  }
}
