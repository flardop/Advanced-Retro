export type RetroStorageAuctionStatus = 'upcoming' | 'live' | 'ended';
export type RetroStorageAuctionPreviewMode = 'blur' | 'partial' | 'clear';
export type RetroStorageAuctionActionType = 'auction' | 'buy' | 'rent';
export type RetroStorageAuctionChatKind = 'message' | 'reaction';

export type RetroStorageAuctionHint = {
  id: string;
  title: string;
  detail: string;
};

export type RetroStorageAuctionRevealItem = {
  id: string;
  label: string;
  itemType: 'console' | 'game' | 'accessory' | 'collectible' | 'document';
  condition: string;
  estimatedValueCents: number;
  verified: boolean;
  marketplaceReady: boolean;
};

export type RetroStorageAuctionBid = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  amountCents: number;
  createdAt: string;
};

export type RetroStorageAuctionChatMessage = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  kind: RetroStorageAuctionChatKind;
  createdAt: string;
};

export type RetroStorageAuctionInterest = {
  id: string;
  userId: string;
  authorName: string;
  action: Exclude<RetroStorageAuctionActionType, 'auction'>;
  createdAt: string;
};

export type RetroStorageAuctionReport = {
  id: string;
  messageId: string;
  userId: string;
  authorName: string;
  reason: string;
  createdAt: string;
};

export type RetroStorageAuctionSeed = {
  slug: string;
  title: string;
  subtitle: string;
  teaser: string;
  category: string;
  warehouseCode: string;
  rarityLabel: string;
  image: string;
  previewMode: RetroStorageAuctionPreviewMode;
  startsAt: string;
  endsAt: string;
  startingBidCents: number;
  minIncrementCents: number;
  extensionWindowSeconds: number;
  extensionBySeconds: number;
  guaranteedMinimum: string;
  minimumEstimatedValueCents: number;
  verificationChecklist: string[];
  hints: RetroStorageAuctionHint[];
  transparencyNote: string;
  legalNote: string;
  rentFeeCentsPerMonth: number | null;
  rentGraceDays: number | null;
  modes: RetroStorageAuctionActionType[];
  revealedContents: RetroStorageAuctionRevealItem[];
  seedBids: RetroStorageAuctionBid[];
  seedChat: RetroStorageAuctionChatMessage[];
};

export type RetroStorageAuctionRuntimeState = {
  bids: RetroStorageAuctionBid[];
  chat: RetroStorageAuctionChatMessage[];
  reminderUserIds: string[];
  interests: RetroStorageAuctionInterest[];
  reports: RetroStorageAuctionReport[];
  extendedUntil: string | null;
  revealedAt: string | null;
  updatedAt: string;
};

export type RetroStorageAuctionListItem = {
  slug: string;
  title: string;
  subtitle: string;
  teaser: string;
  category: string;
  warehouseCode: string;
  rarityLabel: string;
  image: string;
  previewMode: RetroStorageAuctionPreviewMode;
  status: RetroStorageAuctionStatus;
  startsAt: string;
  endsAt: string;
  effectiveEndsAt: string;
  currentBidCents: number;
  nextBidCents: number;
  bidsCount: number;
  leaderName: string | null;
  remindersCount: number;
  buyRequestsCount: number;
  rentRequestsCount: number;
  isReminderActive: boolean;
  guaranteedMinimum: string;
  minimumEstimatedValueCents: number;
  isExtended: boolean;
  isRevealed: boolean;
};

export type RetroStorageAuctionDetail = RetroStorageAuctionListItem & {
  transparencyNote: string;
  legalNote: string;
  minIncrementCents: number;
  extensionWindowSeconds: number;
  extensionBySeconds: number;
  verificationChecklist: string[];
  hints: RetroStorageAuctionHint[];
  modes: RetroStorageAuctionActionType[];
  rentFeeCentsPerMonth: number | null;
  rentGraceDays: number | null;
  bids: RetroStorageAuctionBid[];
  chat: RetroStorageAuctionChatMessage[];
  revealedContents: RetroStorageAuctionRevealItem[];
  reportsCount: number;
  isAuthenticated: boolean;
  currentUserId: string | null;
  canBid: boolean;
  canReveal: boolean;
  winnerUserId: string | null;
  winnerName: string | null;
};
