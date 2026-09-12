// Deliberately in memory: no network requests, login, analytics or stored ballot.
export function createDemoService() {
  let submitted = false;
  return {
    async signIn() {
      return { demo: true };
    },
    async submit() {
      if (submitted)
        throw new Error("This demo ballot has already been completed.");
      submitted = true;
      return { demo: true };
    },
  };
}
