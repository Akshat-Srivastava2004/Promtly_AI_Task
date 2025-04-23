// app/api/upload/route.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();

    const key = `teachervideosaver/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: "pomptly-ai-webassistant",
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const finalUrl = `https://pomptly-ai-webassistant.s3.ap-south-1.amazonaws.com/${key}`;

    return Response.json({ signedUrl, finalUrl });
  } catch (error: unknown) {
    console.error("Error generating signed URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate signed URL" }),
      { status: 500 }
    );
  }
}
