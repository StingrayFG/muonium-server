export type FolderData = {
  uuid: string;
  ownerUuid?: string;
  driveUuid?: string;
  parentUuid?: string | null;

  name?: string;
  nameExtension?: string;
  size?: number | null;

  creationDate?: Date | null;
  modificationDate?: Date | null;

  absolutePath?: string | null;
  isRemoved?: boolean | null;
  isRemovedAsChild?: boolean | null;

  type?: string;
  folders?: any[];
  files?: any[];
}