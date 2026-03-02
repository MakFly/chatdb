"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bot,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  Search,
  MoreHorizontal,
  FolderOpen,
  Archive,
  Bookmark,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Star,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { useSession, signOut } from "@/lib/auth-client";
import { onConversationCreated } from "@/lib/events";
import { Spinner } from "@/components/ui/spinner";
import type { Conversation } from "@/lib/chat-types";

const NAV_ITEMS = [
  { id: "bookmarks", title: "Bookmarks", icon: Bookmark },
  { id: "archive", title: "Archive", icon: Archive },
  { id: "folders", title: "Folders", icon: FolderOpen },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const { data: session } = useSession();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Conversation[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [chatsOpen, setChatsOpen] = React.useState(true);
  const [activeNavItem, setActiveNavItem] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Extract active conversation ID from pathname
  const activeConversationId = React.useMemo(() => {
    const match = pathname.match(/^\/c\/(.+)$/);
    return match?.[1];
  }, [pathname]);

  // Fetch conversations
  React.useEffect(() => {
    api.conversations
      .list()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Debounced API search when query >= 2 chars
  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      api.conversations
        .search(searchQuery.trim())
        .then((results) => setSearchResults(results))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Listen for new conversations created from chat
  React.useEffect(() => {
    return onConversationCreated((conv) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        const now = new Date().toISOString();
        return [
          {
            id: conv.id,
            title: conv.title,
            preview: "",
            starred: false,
            archived: false,
            folderId: undefined,
            createdAt: now,
            updatedAt: now,
            messages: [],
          },
          ...prev,
        ];
      });
    });
  }, []);

  const handleNewChat = () => router.push("/c");

  const handleSelectConversation = (id: string) => {
    router.push(`/c/${id}`);
    setActiveNavItem(null);
  };

  const handleDeleteConversation = async (id: string) => {
    await api.conversations.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) router.push("/c");
  };

  const handleBookmarkConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated = await api.conversations.update(id, { starred: !conv.starred });
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, starred: updated.starred } : c)));
  };

  const handleArchiveConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated = await api.conversations.update(id, { archived: !conv.archived });
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, archived: updated.archived } : c)));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Filter out archived conversations for main list
  const activeConversations = React.useMemo(() => {
    return conversations.filter((c) => !c.archived);
  }, [conversations]);

  // Use API search results when searching, otherwise use local list
  const filteredConversations = React.useMemo(() => {
    if (searchResults !== null) return searchResults.filter((c) => !c.archived);
    return activeConversations;
  }, [searchResults, activeConversations]);

  const bookmarkedConversations = React.useMemo(() => {
    return conversations.filter((c) => c.starred && !c.archived);
  }, [conversations]);

  const archivedConversations = React.useMemo(() => {
    return conversations.filter((c) => c.archived);
  }, [conversations]);

  const DATE_GROUP_ORDER = [
    "Aujourd'hui",
    "Hier",
    "7 derniers jours",
    "30 derniers jours",
    "Plus ancien",
  ] as const;

  function getDateGroup(updatedAt: string | undefined): (typeof DATE_GROUP_ORDER)[number] {
    if (!updatedAt) return "Plus ancien";
    const d = new Date(updatedAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setDate(monthAgo.getDate() - 30);

    if (d >= todayStart) return "Aujourd'hui";
    if (d >= yesterdayStart) return "Hier";
    if (d >= weekAgo) return "7 derniers jours";
    if (d >= monthAgo) return "30 derniers jours";
    return "Plus ancien";
  }

  const groupedConversations = React.useMemo(() => {
    const groups: Record<string, Conversation[]> = {};
    filteredConversations.forEach((conv) => {
      const group = getDateGroup(conv.updatedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    });
    return groups;
  }, [filteredConversations]);

  const sortedGroupKeys = React.useMemo(() => {
    return DATE_GROUP_ORDER.filter((k) => groupedConversations[k]?.length);
  }, [groupedConversations]);

  const isCollapsed = state === "collapsed";

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const renderConversationList = (convs: Conversation[]) => (
    <SidebarMenu>
      {convs.map((conversation) => (
        <SidebarMenuItem key={conversation.id}>
          <SidebarMenuButton
            isActive={activeConversationId === conversation.id}
            onClick={() => handleSelectConversation(conversation.id)}
            tooltip={conversation.title}
          >
            {conversation.starred && (
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
            )}
            <span className="truncate" title={conversation.title}>
              {conversation.title.length > 40
                ? conversation.title.slice(0, 37) + "..."
                : conversation.title}
            </span>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => handleBookmarkConversation(conversation.id)}>
                <Bookmark className="mr-2 size-4" />
                {conversation.starred ? "Remove bookmark" : "Bookmark"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchiveConversation(conversation.id)}>
                <Archive className="mr-2 size-4" />
                {conversation.archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteConversation(conversation.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/c">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AI Assistant</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewChat} tooltip="New Chat">
                  <Plus className="size-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isCollapsed && (
              <div className="mt-2 px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <SidebarInput
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={chatsOpen} onOpenChange={setChatsOpen} className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                <MessageSquare className="mr-2 size-4" />
                Chats
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                {isLoading || isSearching ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="mx-auto" />
                  </div>
                ) : searchResults !== null ? (
                  searchResults.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No results found
                    </div>
                  ) : (
                    renderConversationList(searchResults.filter((c) => !c.archived))
                  )
                ) : (
                  sortedGroupKeys.map((date) => (
                    <div key={date}>
                      {!isCollapsed && (
                        <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
                          {date}
                        </div>
                      )}
                      {renderConversationList(groupedConversations[date])}
                    </div>
                  ))
                )}
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={activeNavItem === item.id}
                        onClick={() =>
                          setActiveNavItem(activeNavItem === item.id ? null : item.id)
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {((item.id === "bookmarks" && bookmarkedConversations.length > 0) ||
                          (item.id === "archive" && archivedConversations.length > 0)) && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {item.id === "bookmarks"
                              ? bookmarkedConversations.length
                              : archivedConversations.length}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {item.id === "bookmarks" &&
                        bookmarkedConversations.length > 0 && (
                          <div className="pl-4">
                            {renderConversationList(bookmarkedConversations)}
                          </div>
                        )}
                      {item.id === "archive" &&
                        archivedConversations.length > 0 && (
                          <div className="pl-4">
                            {renderConversationList(archivedConversations)}
                          </div>
                        )}
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Docs Mémoire"
              onClick={() => router.push("/docs/memory")}
            >
              <BookOpen className="size-4" />
              <span>Docs Mémoire</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Guide Embeddings"
              onClick={() => router.push("/help/memory")}
            >
              <HelpCircle className="size-4" />
              <span>Guide Embeddings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" onClick={() => router.push("/settings")}>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={userName}>
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
