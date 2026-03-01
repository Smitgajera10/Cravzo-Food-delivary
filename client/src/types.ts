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
}

export interface IRestaurent {
  id: string;
  name: string;
  ownerId: String; // from Auth service (User id)
  description: String;
  image: String;
  address: String;
  // city         String
  // state        String
  // country      String
  // postalCode   String
  latitude: number;
  longitude: number;
  phone: String;
  isVerified: boolean;
  isActive: boolean;
}
