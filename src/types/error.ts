export enum GstcErrorCode {
  GSTC_OK = 0,
  GSTC_NULL_ARGUMENT = -1,
  GSTC_UNREACHABLE = -2,
  GSTC_TIMEOUT = -3,
  GSTC_OOM = -4,
  GSTC_TYPE_ERROR = -5,
  GSTC_MALFORMED = -6,
  GSTC_NOT_FOUND = -7,
  GSTC_SEND_ERROR = -8,
  GSTC_RECV_ERROR = -9,
  GSTC_SOCKET_ERROR = -10,
  GSTC_THREAD_ERROR = -11,
  GSTC_BUS_TIMEOUT = -12,
  GSTC_SOCKET_TIMEOUT = -13,
}

export class GstcError extends Error {
  public date: Date;
  constructor(message: string, public code: GstcErrorCode) {
    super(message);
    this.name = "GstcError";
    this.date = new Date();
  }
}

export class GstdError extends Error {
  public date: Date;
  constructor(message: string, public code: number) {
    super(message);
    this.name = "GstdError";
    this.date = new Date();
  }
}
