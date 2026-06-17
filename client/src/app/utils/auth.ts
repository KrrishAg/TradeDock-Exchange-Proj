import CredentialsProvider from "next-auth/providers/credentials";

export const NEXT_AUTH = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      //@ts-expect-error authorize giving red squigly
      async authorize(credentials, ) {
        if (!credentials?.userId || !credentials?.password) {
          return null;
        }
        const avlUsers: Record<string, string> = { "1": "111", "2": "222" };
        if (
          avlUsers[credentials.userId] &&
          avlUsers[credentials.userId] === credentials.password
        ) {
          // console.log("Came here11");
          return { userId: credentials.userId };
        } else {
          // console.log("Came here22");
          return null;
        }
      },
    }),
  ],
  secret: "process.env.NEXTAUTH_SECRET",
  callbacks: {
    //Add the user Id to token
    //@ts-expect-error abc
    async jwt({ token, user }) {
      if (user) {
        // console.log(user);
        token.userId = user.userId;
      }
      return token;
    },
    //@ts-expect-error abc
    async session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId;
      }
      return session;
    },
  },
};
