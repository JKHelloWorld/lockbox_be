export default interface File {
  name: string | undefined;
  ext: string | undefined;
  data: Buffer | undefined;
}
