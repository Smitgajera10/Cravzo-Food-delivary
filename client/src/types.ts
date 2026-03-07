export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  location: LocationData | null;
  loadingLocation: boolean;
  city: string;
  cart : ICart[] | null;
  fetchCart : ()=>Promise<void>;
  subtotal : number;
  quantity : number;
}

export interface IRestaurent {
  id: string;
  name: string;
  ownerId: string; // from Auth service (User id)
  description: string;
  image: string;
  address: string;
  latitude: number;
  distance: number;
  longitude: number;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  id: string;
  userId: string;
  restaurantId: string;
  itemId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  restaurant: string | IRestaurent;
  item: string | IMenuItem;
}
