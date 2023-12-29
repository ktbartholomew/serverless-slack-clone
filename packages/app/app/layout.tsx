"use client";

import { Lato } from "next/font/google";
import "./globals.css";
import layout from "./layout.module.css";
import Link from "next/link";
import {
  UserAvatar,
  UserDisplayName,
  useCurrentUser,
  useUsers,
} from "../components/users";
import { RealtimeContext, useSocket } from "../components/realtime";

const lato = Lato({ weight: ["400", "700"], subsets: ["latin"] });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useCurrentUser();
  const users = useUsers();
  const { socket, readyState } = useSocket(user?.id ?? "");

  return (
    <RealtimeContext.Provider value={{ socket, readyState }}>
      <html>
        <body className={`m-0 ${lato.className}`}>
          <div className={layout.themeWrapper}></div>
          {user ? (
            <div className="h-[100vh] w-[100vw] grid">
              <div id="top-nav" className="relative h-[40px]"></div>
              <div
                id="workspace"
                className="pr-1 pb-1 relative w-[100vw] h-[calc(100vh-40px)] grid grid-cols-[76px,auto]"
              >
                <div
                  id="tab-rail"
                  className="w-[76px] h-[calc(100vh-40px)] grid grid-rows-[auto,76px] text-white"
                >
                  <div>
                    <div className="p-2 text-center text-xs">
                      <Link href="/">
                        <div className="text-2xl">🏠</div>
                        Home
                      </Link>
                    </div>
                    <div className="p-2 text-center text-xs">
                      <div className="text-2xl">💬</div>
                      DMs
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="">
                      <UserAvatar id={user.id} />
                    </div>
                  </div>
                </div>
                {children}
              </div>
            </div>
          ) : (
            <div className="relative flex h-[100vh] items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-md p-8 text-center">
                <h3 className="font-bold text-xl mb-4">Pick a user</h3>
                <ul>
                  {users.map((user) => (
                    <li key={user.id}>
                      <button
                        className="block w-full flex p-2 gap-4 items-center hover:bg-gray-50"
                        onClick={() => setUser(user.id)}
                      >
                        <UserAvatar id={user.id} />
                        <span className="font-bold inline-block mr-3">
                          <UserDisplayName id={user.id} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </body>
      </html>
    </RealtimeContext.Provider>
  );
}
