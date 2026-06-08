import React, { createContext, useContext, useState, useEffect } from "react";

export interface Member {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  phone: string;
  email: string;
  avatarColor: string;
  status: "active" | "recent" | "inactive" | "pending";
  lastActivity: string;
  notifLevel: "all" | "critical" | "daily" | "off";
  isEmergencyContact: boolean;
  emergencyPriority: number;
  permissions: { ecg: boolean; diary: boolean; alerts: boolean; dashboard: boolean };
}

interface FamilyContextType {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembersState] = useState<Member[]>(() => {
    try {
      const item = window.localStorage.getItem("cs_family_members");
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.warn("Error reading localStorage", error);
      return [];
    }
  });

  const setMembers: React.Dispatch<React.SetStateAction<Member[]>> = (valOrFunc) => {
    try {
      const newState = typeof valOrFunc === "function" ? valOrFunc(members) : valOrFunc;
      setMembersState(newState);
      window.localStorage.setItem("cs_family_members", JSON.stringify(newState));
    } catch (error) {
      console.warn("Error setting localStorage", error);
    }
  };

  return (
    <FamilyContext.Provider value={{ members, setMembers }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
}
