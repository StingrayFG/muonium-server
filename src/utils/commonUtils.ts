import { FolderData } from '@/types/FolderData';
import { UuidOnly } from '@/types/UuidOnly';


const commonUtils = {
  checkIfFolderIsEditable: (folderData: UuidOnly) => { 
    return (folderData.uuid && !['home', 'trash'].includes(folderData.uuid))
  },
}

export default commonUtils; 