// A single home displayed as a clickable card on the Homes screen
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

type HomeCardProps = {
  id: string;
  name: string;
  address: string | null;
  residentCount: number;
  flaggedCount: number;
};

export default function HomeCard({ id, name, address, residentCount, flaggedCount }: HomeCardProps) {
  return (
    <Link href={`/homes/${id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 bg-white group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
              {name}
            </h3>
            {flaggedCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1 flex-shrink-0 text-xs">
                <AlertCircle size={11} />
                {flaggedCount} flagged
              </Badge>
            )}
          </div>
          {address && (
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
              <MapPin size={13} />
              <span>{address}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={15} />
            <span>{residentCount} resident{residentCount !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
