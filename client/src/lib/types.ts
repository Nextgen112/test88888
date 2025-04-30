export enum EventType {
  FILE_ACCESS = 'file_access',
  FILE_UPLOAD = 'file_upload',
}

export enum AccessStatus {
  SUCCESSFUL = 'successful',
  DENIED = 'denied',
  UPLOAD = 'upload',
}

export enum IpStatus {
  ACTIVE = 'active',
  TEMPORARY = 'temporary',
  EXPIRED = 'expired',
}

export interface NotificationProps {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
}

export interface AccessDeniedDialogProps {
  show: boolean;
  ipAddress: string;
  onClose: () => void;
  onAddToWhitelist: (ipAddress: string) => void;
}

export interface FileWithUrl extends File {
  url: string;
}

export interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface FilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}
