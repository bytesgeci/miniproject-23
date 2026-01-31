import { UserRole, getRoleInfo } from "./config";

interface AppHeaderProps {
  userRole: UserRole;
}

export function AppHeader({ userRole }: AppHeaderProps) {
  const roleInfo = getRoleInfo(userRole);

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 ${roleInfo.color} rounded-lg flex items-center justify-center`}>
              <roleInfo.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">Faculty Management</h1>
              <p className="text-sm text-gray-500">College</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm">Dr. Sarah Johnson</p>
              <p className="text-xs text-gray-500">
                Computer Science Department
              </p>
            </div>
            <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
              SJ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
