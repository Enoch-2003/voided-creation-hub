
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Outpass, Admin } from "@/lib/types";
import { Search, Filter, RefreshCw, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import storageSync from "@/lib/storageSync";
import { useOutpasses } from "@/hooks/useOutpasses";

interface AdminDashboardProps {
  user: Admin;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const { allOutpasses, isLoading } = useOutpasses();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filteredOutpasses, setFilteredOutpasses] = useState<Outpass[]>([]);
  const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter and search outpasses
  useEffect(() => {
    if (!allOutpasses) return;

    let result = [...allOutpasses];
    
    // Filter by status
    if (filterType !== "all") {
      result = result.filter(outpass => outpass.status === filterType);
    }
    
    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      result = result.filter(outpass => {
        const outpassDate = new Date(outpass.exitDateTime).toDateString();
        return outpassDate === filterDate;
      });
    }
    
    // Search by student name or mentor name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        outpass => 
          outpass.studentName.toLowerCase().includes(term) || 
          (outpass.mentorName && outpass.mentorName.toLowerCase().includes(term)) ||
          outpass.enrollmentNumber.toLowerCase().includes(term)
      );
    }
    
    // Sort by most recent first
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setFilteredOutpasses(result);
  }, [allOutpasses, searchTerm, filterType, dateFilter]);
  
  const handleViewOutpass = (outpass: Outpass) => {
    setSelectedOutpass(outpass);
    setIsDialogOpen(true);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "denied":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all campus outpasses
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="inline-flex bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>{filteredOutpasses.length} Outpasses</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Section */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Outpasses</CardTitle>
            <CardDescription>
              Search and filter through all outpasses in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setDateFilter("");
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outpasses Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Outpasses</CardTitle>
            <CardDescription>
              Real-time list of all outpasses in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOutpasses.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No outpasses found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Exit Date & Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOutpasses.map((outpass) => (
                      <TableRow key={outpass.id} className="cursor-pointer hover:bg-muted/60">
                        <TableCell className="font-mono text-xs">
                          {outpass.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{outpass.studentName}</div>
                            <div className="text-xs text-muted-foreground">{outpass.enrollmentNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(outpass.exitDateTime)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {outpass.reason}
                        </TableCell>
                        <TableCell>
                          {outpass.mentorName || "Not assigned"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(outpass.status)}>
                            {outpass.status.charAt(0).toUpperCase() + outpass.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewOutpass(outpass)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-3">
            <div className="text-sm text-muted-foreground">
              Showing {filteredOutpasses.length} outpasses
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Outpass Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Outpass Details</DialogTitle>
            <DialogDescription>
              Complete information about this outpass
            </DialogDescription>
          </DialogHeader>
          
          {selectedOutpass && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge className={getStatusColor(selectedOutpass.status)}>
                    {selectedOutpass.status.charAt(0).toUpperCase() + selectedOutpass.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created On</h4>
                  <p className="text-sm">{formatDateTime(selectedOutpass.createdAt)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Student Information</h4>
                <p className="font-medium">{selectedOutpass.studentName}</p>
                <p className="text-sm">{selectedOutpass.enrollmentNumber}</p>
                <p className="text-sm">Section: {selectedOutpass.studentSection || "N/A"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Exit Details</h4>
                <p className="font-medium">Reason: {selectedOutpass.reason}</p>
                <p className="text-sm">Date & Time: {formatDateTime(selectedOutpass.exitDateTime)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Approval Details</h4>
                <p className="text-sm">Mentor: {selectedOutpass.mentorName || "Not assigned"}</p>
                {selectedOutpass.status === "approved" && (
                  <p className="text-sm text-green-600 font-medium">
                    Approved on: {formatDateTime(selectedOutpass.updatedAt)}
                  </p>
                )}
                {selectedOutpass.status === "denied" && (
                  <>
                    <p className="text-sm text-red-600 font-medium">
                      Denied on: {formatDateTime(selectedOutpass.updatedAt)}
                    </p>
                    <p className="text-sm mt-1">
                      Reason: {selectedOutpass.denyReason || "No reason provided"}
                    </p>
                  </>
                )}
              </div>
              
              {selectedOutpass.scanTimestamp && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Scan Information</h4>
                  <p className="text-sm">
                    Scanned at: {formatDateTime(selectedOutpass.scanTimestamp)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
