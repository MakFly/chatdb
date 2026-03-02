"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
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
import { LocaleSwitcher } from "@/components/locale-switcher";

export function AppSidebar() {
  const t = useTranslations("chat.sidebar");
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();

  const NAV_ITEMS = [
    { id: "bookmarks", title: t("bookmarks"), icon: Bookmark },
    { id: "archive", title: t("archive"), icon: Archive },
    { id: "folders", title: t("folders"), icon: FolderOpen },
  ];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push("/login" as any);
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
    "today",
    "yesterday",
    "last7Days",
    "last30Days",
    "older",
  ] as const;

  const DATE_GROUP_LABELS: Record<(typeof DATE_GROUP_ORDER)[number], string> = {
    today: t("dateToday"),
    yesterday: t("dateYesterday"),
    last7Days: t("dateLast7Days"),
    last30Days: t("dateLast30Days"),
    older: t("dateOlder"),
  };

  function getDateGroup(updatedAt: string | undefined): (typeof DATE_GROUP_ORDER)[number] {
    if (!updatedAt) return "older";
    const d = new Date(updatedAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setDate(monthAgo.getDate() - 30);

    if (d >= todayStart) return "today";
    if (d >= yesterdayStart) return "yesterday";
    if (d >= weekAgo) return "last7Days";
    if (d >= monthAgo) return "last30Days";
    return "older";
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
                {conversation.starred ? t("removeBookmark") : t("bookmark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchiveConversation(conversation.id)}>
                <Archive className="mr-2 size-4" />
                {conversation.archived ? t("unarchive") : t("archive")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteConversation(conversation.id)}
              >
                <Trash2 className="mr-2 size-4" />
                {t("delete")}
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
                  <span className="truncate font-semibold">{t("aiAssistant")}</span>
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
                <SidebarMenuButton onClick={handleNewChat} tooltip={t("newChat")}>
                  <Plus className="size-4" />
                  <span>{t("newChat")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isCollapsed && (
              <div className="mt-2 px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <SidebarInput
                    placeholder={t("searchPlaceholder")}
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
                {t("chats")}
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
                      {t("noResults")}
                    </div>
                  ) : (
                    renderConversationList(searchResults.filter((c) => !c.archived))
                  )
                ) : (
                  sortedGroupKeys.map((date) => (
                    <div key={date}>
                      {!isCollapsed && (
                        <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
                          {DATE_GROUP_LABELS[date]}
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
              tooltip={t("docsMemory")}
              onClick={() => router.push("/docs/memory")}
            >
              <BookOpen className="size-4" />
              <span>{t("docsMemory")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("guideEmbeddings")}
              onClick={() => router.push("/help/memory")}
            >
              <HelpCircle className="size-4" />
              <span>{t("guideEmbeddings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("settings")} onClick={() => router.push("/settings")}>
              <Settings className="size-4" />
              <span>{t("settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center px-2 py-1">
              <LocaleSwitcher variant={isCollapsed ? "icon" : "full"} />
            </div>
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
                <DropdownMenuItem>{t("accountSettings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
