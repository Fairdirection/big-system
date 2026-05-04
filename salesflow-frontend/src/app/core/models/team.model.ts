export interface Team {
  _id: string;
  name?: string;
  teamLeaderId: {
    _id: string;
    name: string;
    code: string;
  };
  memberIds: {
    _id: string;
    name: string;
    code: string;
  }[];
  isActive: boolean;
  performance?: {
    totalAdjustedTarget: number;
    totalAchieved: number;
    overallAchievementPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
