import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!

// ── Key builders ────────────────────────────────────────────────────────────

export function mediaKey(orgId: string, courseId: string, filename: string) {
  return `media/${orgId}/${courseId}/${filename}`
}
export function fontKey(orgId: string, filename: string) {
  return `fonts/${orgId}/${filename}`
}
export function exportKey(courseId: string, timestamp: number) {
  return `exports/${courseId}/${timestamp}/course.zip`
}
export function thumbnailKey(courseId: string) {
  return `thumbnails/${courseId}.jpg`
}
export function importStagingKey(sessionId: string) {
  return `imports/staging/${sessionId}/upload.zip`
}

// ── Presigned URLs ───────────────────────────────────────────────────────────

/** Generate a presigned PUT URL for direct browser → R2 upload */
export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(R2, command, { expiresIn })
}

/** Generate a presigned GET URL for private asset access */
export async function getPresignedGetUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(R2, command, { expiresIn })
}

/** Public URL for published assets served via custom domain */
export function publicUrl(key: string): string {
  return `${PUBLIC_DOMAIN}/${key}`
}

// ── Server-side upload (for SCORM export packages) ───────────────────────────

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await R2.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  )
}

export async function deleteObject(key: string): Promise<void> {
  await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ── Fetch from R2 (for SCORM export — read media back as buffer) ─────────────

export async function fetchBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await R2.send(command)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
