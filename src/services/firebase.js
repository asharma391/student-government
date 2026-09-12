// Optional staging integration. Loaded only when mode is explicitly 'firebase'.
// Deployment requires the matching rules, election configuration and eligibility registry.
export async function createFirebaseService(config) {
  const [{ initializeApp }, authSDK, dbSDK] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js"),
  ]);
  const app = initializeApp(config.firebase),
    auth = authSDK.getAuth(app),
    db = dbSDK.getDatabase(app);
  await authSDK.setPersistence(auth, authSDK.inMemoryPersistence);
  return {
    async signIn() {
      const provider = new authSDK.GoogleAuthProvider();
      provider.setCustomParameters({
        hd: config.allowedDomain,
        prompt: "select_account",
      });
      const { user } = await authSDK.signInWithPopup(auth, provider);
      // UX guard only; the database rules independently enforce identity + eligibility.
      if (
        !user.emailVerified ||
        user.email?.split("@")[1] !== config.allowedDomain
      ) {
        await authSDK.signOut(auth);
        throw new Error("Please sign in with an eligible school account.");
      }
      return user;
    },
    async submit(ballot) {
      if (!auth.currentUser) throw new Error("Sign in before submitting.");
      // One fixed path per election and authenticated voter. Create-only rules arbitrate races.
      await dbSDK.set(
        dbSDK.ref(
          db,
          `elections/${config.electionId}/submissions/${auth.currentUser.uid}`,
        ),
        {
          ...ballot,
          timestamp: dbSDK.serverTimestamp(),
        },
      );
      await authSDK.signOut(auth).catch(() => {});
      return { demo: false };
    },
  };
}
