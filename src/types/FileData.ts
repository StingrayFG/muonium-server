export type FileData = {
  uuid: string;
  ownerUuid?: string;
  driveUuid?: string;
  parentUuid?: string;

  name?: string;
  nameExtension?: string;
  size?: number;

  creationDate?: Date | null;
  modificationDate?: Date | null;

  isRemoved?: boolean | null;

  thumbnail?: string;
  type?: string;
}