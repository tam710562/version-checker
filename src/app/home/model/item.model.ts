/* eslint-disable @typescript-eslint/naming-convention */
export interface Item {
  'Title ID': string;
  'Base Title ID': string;
  'Title Name': string;
  'Display Version': string;
  'Version': string;
  'Latest Version': string;
  'System Update': string;
  'System Version': string;
  'Application Version': string;
  'Masterkey': string;
  'Title Key': string;
  'Publisher': string;
  'Languages': string;
  'Filename': string;
  'Filesize': string;
  'Type': string;
  'Distribution': string;
  'Structure': string;
  'Signature': string;
  'Permission': string;
  'Error': string;
  dlc?: Item[];
}
