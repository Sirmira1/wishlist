"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Star, Pin, Pencil, Copy, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuickUpdate, useDuplicateItem, useDeleteItem, useSession } from "@/hooks/queries";
import type { Item } from "@/types";

export function ItemActions({ item, size = "icon-sm" }: { item: Item; size?: "icon-sm" | "icon" }) {
  const { data: session } = useSession();
  const quick = useQuickUpdate();
  const duplicate = useDuplicateItem();
  const del = useDeleteItem();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canEdit =
    session?.isAdmin || (session?.userId != null && item.user?.id === session.userId);

  // Signed-out visitors just get the external link (if any).
  if (!session?.isAuthenticated) {
    return item.url ? (
      <Button asChild variant="ghost" size={size} aria-label="Open link">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    ) : null;
  }

  // Signed in but not the owner → offer to fork it into your own wishlist.
  if (!canEdit) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size} aria-label="Item actions" onClick={(e) => e.preventDefault()}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => duplicate.mutate(item.id, { onSuccess: () => toast.success("Added to your wishlist") })}
          >
            <Copy /> Add to my wishlist
          </DropdownMenuItem>
          {item.url && (
            <DropdownMenuItem asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Open link
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size} aria-label="Item actions" onClick={(e) => e.preventDefault()}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() =>
              quick.mutate(
                { id: item.id, patch: { favorite: !item.favorite } },
                { onSuccess: () => toast.success(item.favorite ? "Unfavorited" : "Favorited") }
              )
            }
          >
            <Star className={item.favorite ? "fill-amber-400 text-amber-400" : ""} />
            {item.favorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              quick.mutate(
                { id: item.id, patch: { pinned: !item.pinned } },
                { onSuccess: () => toast.success(item.pinned ? "Unpinned" : "Pinned") }
              )
            }
          >
            <Pin className={item.pinned ? "fill-primary text-primary" : ""} />
            {item.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/items/${item.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              duplicate.mutate(item.id, { onSuccess: () => toast.success("Duplicated") })
            }
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          {item.url && (
            <DropdownMenuItem asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Open link
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{item.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the item and its price history. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() =>
                del.mutate(item.id, {
                  onSuccess: () => {
                    toast.success("Item deleted");
                    setConfirmOpen(false);
                  },
                  onError: (e) => toast.error((e as Error).message),
                })
              }
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
