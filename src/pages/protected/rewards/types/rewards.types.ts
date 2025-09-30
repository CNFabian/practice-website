export interface RewardOffer {
  id: string;
  title: string;
  description: string;
  vendor: string;
  cost: number;
  discount: string;
  category: 'featured' | 'regular';
  icon: string;
  iconBackgroundColor: string;
}

export interface NavigationButton {
  label: string;
  isActive: boolean;
  onClick: () => void;
}