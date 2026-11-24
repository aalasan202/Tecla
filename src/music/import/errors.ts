import type { RejectDetail, RejectReason } from "./types";

/** Motivo por el que un archivo no se puede importar. */
export class ImportError extends Error {
  constructor(
    readonly reason: RejectReason,
    readonly detail?: RejectDetail,
  ) {
    super(reason);
    this.name = "ImportError";
  }
}
