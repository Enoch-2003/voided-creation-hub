
import { Outpass } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, FileText, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OutpassCardProps {
  outpass: Outpass;
  userRole: "student" | "mentor";
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  className?: string;
}

export function OutpassCard({
  outpass,
  userRole,
  onApprove,
  onDeny,
  className,
}: OutpassCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    denied: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn(
              "font-medium capitalize px-3 py-1",
              statusColors[outpass.status]
            )}
          >
            {outpass.status}
          </Badge>
          <CardDescription>
            {userRole === "mentor" ? "Request" : "Outpass"} #{outpass.id.slice(-5)}
          </CardDescription>
        </div>
        <CardTitle className="text-xl mt-2">
          {userRole === "mentor" ? outpass.studentName : "Exit Request"}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center mt-1">
            <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span>{formatDateTime(outpass.exitDateTime)}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {userRole === "mentor" && (
          <div className="flex items-start space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{outpass.studentName}</p>
              <p className="text-muted-foreground">
                Enrollment: {outpass.enrollmentNumber}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Reason</p>
            <p>{outpass.reason}</p>
          </div>
        </div>

        {outpass.denyReason && (
          <div className="flex items-start space-x-2 text-sm mt-2">
            <X className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Denial Reason</p>
              <p>{outpass.denyReason}</p>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Requested</p>
            <p className="text-muted-foreground">
              {formatDateTime(outpass.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        {userRole === "mentor" && outpass.status === "pending" ? (
          <>
            <Button
              variant="destructive"
              onClick={() => onDeny && onDeny(outpass.id)}
              className="w-[48%]"
            >
              <X className="h-4 w-4 mr-2" /> Deny
            </Button>
            <Button
              variant="default"
              onClick={() => onApprove && onApprove(outpass.id)}
              className="w-[48%]"
            >
              <Check className="h-4 w-4 mr-2" /> Approve
            </Button>
          </>
        ) : outpass.status === "approved" ? (
          <Button asChild className="w-full">
            <Link to={`/${userRole}/outpass/${outpass.id}`}>
              View Details
            </Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
