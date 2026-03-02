"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { SiteHeader } from "@/components/chat/site-header";

export function ChatLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <div className="flex h-svh min-h-0 flex-1 flex-col">
          <SiteHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
