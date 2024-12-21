import { User, File, Folder, Bookmark, Drive } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      ogUser?: User;
      ogBookmark?: Bookmark;
      ogFile?: File;
      ogFolder?: Folder;
      ogParentFolder? : FolderData;
      ogDrive?: Drive;
    }
  }
}