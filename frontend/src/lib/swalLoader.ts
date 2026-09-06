type SwalModule = typeof import('sweetalert2').default;

let swalModule: SwalModule | null = null;
let swalLoadPromise: Promise<SwalModule> | null = null;

export async function getSwal(): Promise<SwalModule> {
  if (swalModule) {
    return swalModule;
  }

  if (!swalLoadPromise) {
    swalLoadPromise = Promise.all([
      import('sweetalert2'),
      import('sweetalert2/dist/sweetalert2.min.css'),
    ])
      .then(([module]) => {
        swalModule = module.default;
        return swalModule;
      })
      .catch((error) => {
        swalLoadPromise = null;
        throw error;
      });
  }

  return swalLoadPromise;
}
