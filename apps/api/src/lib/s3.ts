import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET || 'carecommand';

export const s3Client = new S3Client({
  ...(endpoint && {
    endpoint,
    forcePathStyle: true,
    region,
  }),
  ...(!endpoint && { region }),
  credentials: process.env.S3_ACCESS_KEY
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      }
    : undefined,
});

export async function uploadFile(
  key: string,
  body: Buffer,
  mimeType: string,
  metadata?: Record<string, string>
) {
  const cmd: any = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: mimeType,
    Metadata: metadata,
  };
  if (!endpoint) cmd.ServerSideEncryption = 'AES256';
  await s3Client.send(new PutObjectCommand(cmd));
  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 900): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
}
