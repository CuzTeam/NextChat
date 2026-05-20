import { auth } from "../[...nextauth]/auth-config";
import { NextResponse } from "next/server";

export const GET = auth((req) => {
  if (req.auth) {
    return NextResponse.json({
      authenticated: true,
      accessToken: req.auth.accessToken ?? null,
    });
  }
  return NextResponse.json({
    authenticated: false,
    accessToken: null,
  });
});