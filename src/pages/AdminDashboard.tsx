import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Outpass, Admin, SerialCodeLog } from "@/lib/types";
import { Search, Filter, RefreshCw, Eye, Save, History, CalendarIcon, Archive } from "lucide-react";
import { formatDateTime, generateId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useOutpasses } from "@/hooks/useOutpasses";
import { useSerialPrefix } from "@/hooks/useSerialPrefix";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDashboardProps {
  user: Admin;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const { allOutpasses, isLoading } = useOutpasses();
  const { serialPrefix, prefixLogs, isLoading: isPrefixLoading, updateSerialPrefix, refreshData } = useSerialPrefix();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filteredOutpasses, setFilteredOutpasses] = useState<Outpass[]>([]);
  const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  
  // Serial code management
  const [newSerialCodePrefix, setNewSerialCodePrefix] = useState(serialPrefix);
  const [isSerialCodeDialogOpen, setIsSerialCodeDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [prefixSearchDate, setPrefixSearchDate] = useState("");
  const [filteredPrefixLogs, setFilteredPrefixLogs] = useState<SerialCodeLog[]>([]);
  
  // Update new prefix state when serialPrefix changes
  useEffect(() => {
    setNewSerialCodePrefix(serialPrefix);
  }, [serialPrefix]);
  
  // Filter logs when the search date changes
  useEffect(() => {
    if (!prefixSearchDate || !prefixLogs.length) {
      setFilteredPrefixLogs(prefixLogs);
      return;
    }
    
    const searchDate = new Date(prefixSearchDate).toDateString();
    const filtered = prefixLogs.filter(log => {
      const logDate = new Date(log.createdAt).toDateString();
      return logDate === searchDate;
    });
    
    setFilteredPrefixLogs(filtered);
  }, [prefixSearchDate, prefixLogs]);
  
  // Filter and search outpasses
  useEffect(() => {
    if (!allOutpasses) return;

    let result = [...allOutpasses];
    
    // Filter for today's outpasses when on Today tab
    if (activeTab === "today") {
      const today = new Date().toDateString();
      result = result.filter(outpass => {
        const outpassDate = new Date(outpass.createdAt).toDateString();
        return outpassDate === today;
      });
    }
    
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
    
    // Search by student name or mentor name or serial code
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        outpass => 
          outpass.studentName.toLowerCase().includes(term) || 
          (outpass.mentorName && outpass.mentorName.toLowerCase().includes(term)) ||
          outpass.enrollmentNumber.toLowerCase().includes(term) ||
          (outpass.serialCode && outpass.serialCode.toLowerCase().includes(term))
      );
    }
    
    // Sort by most recent first
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setFilteredOutpasses(result);
  }, [allOutpasses, searchTerm, filterType, dateFilter, activeTab]);
  
  const handleViewOutpass = (outpass: Outpass) => {
    setSelectedOutpass(outpass);
    setIsDialogOpen(true);
  };
  
  const handleUpdateSerialCode = async () => {
    // Validate the prefix
    if (!newSerialCodePrefix) {
      toast.error("Please enter a valid prefix");
      return;
    }
    
    const success = await updateSerialPrefix(newSerialCodePrefix, user.name);
    if (success) {
      setIsSerialCodeDialogOpen(false);
      // Refresh the logs data
      refreshData();
    }
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset other filters when changing tabs
    setDateFilter("");
    setFilterType("all");
    setSearchTerm("");
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
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => setIsSerialCodeDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              Manage Serial Code
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => setIsHistoryDialogOpen(true)}
            >
              <History className="h-4 w-4" />
              View Prefix History
            </Button>
            <div className="inline-flex bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>{filteredOutpasses.length} Outpasses</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="today" value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList>
            <TabsTrigger value="today">Today's Outpasses</TabsTrigger>
            <TabsTrigger value="all">All Outpass History</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter and Search Section */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Outpasses</CardTitle>
            <CardDescription>
              Search and filter through {activeTab === "today" ? "today's" : "all"} outpasses in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, ID or serial code..."
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

        {/* Current Serial Code Info */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Serial Code Settings</CardTitle>
            <CardDescription>
              This prefix will be used for all new outpass serial codes in the format AUMP-{serialPrefix}-XXXXXX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Current Prefix: </span>
                {isPrefixLoading ? (
                  <span className="inline-flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  <Badge variant="outline" className="font-mono text-lg ml-2 bg-blue-50">
                    {serialPrefix}
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsSerialCodeDialogOpen(true)}>
                Change Prefix
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outpasses Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {activeTab === "today" ? "Today's Outpasses" : "All Outpass History"}
            </CardTitle>
            <CardDescription>
              {activeTab === "today" 
                ? "Real-time list of outpasses created today" 
                : "Complete history of all outpasses created in the system"}
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
                      <TableHead>Serial Code</TableHead>
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
                          {outpass.serialCode || `AUMP-${serialPrefix}-${outpass.id.substring(0, 6).toUpperCase()}`}
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
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Serial Code</h4>
                <p className="font-mono font-medium">
                  {selectedOutpass.serialCode || `AUMP-${serialPrefix}-${selectedOutpass.id.substring(0, 6).toUpperCase()}`}
                </p>
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
      
      {/* Serial Code Management Dialog */}
      <Dialog open={isSerialCodeDialogOpen} onOpenChange={setIsSerialCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Serial Code Prefix</DialogTitle>
            <DialogDescription>
              Set a new prefix for outpass serial codes. The format will be AUMP-[PREFIX]-XXXXXX
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serialPrefix">Serial Code Prefix</Label>
              <Input
                id="serialPrefix"
                placeholder="Enter prefix (e.g. XYZ, ABC, 123)"
                value={newSerialCodePrefix}
                onChange={(e) => setNewSerialCodePrefix(e.target.value.toUpperCase())}
                maxLength={5}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This prefix will be used for all new outpass serial codes.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium">Preview:</h4>
              <p className="font-mono mt-1">AUMP-{newSerialCodePrefix}-123456</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSerialCodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSerialCode}>
              Update Prefix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Serial Code History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Serial Code Prefix History</DialogTitle>
            <DialogDescription>
              Record of all prefix changes made by administrators
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="prefixSearchDate">Filter by Date</Label>
              <div className="flex gap-2">
                <Input
                  id="prefixSearchDate"
                  type="date"
                  value={prefixSearchDate}
                  onChange={(e) => setPrefixSearchDate(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setPrefixSearchDate("")}
                  disabled={!prefixSearchDate}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isPrefixLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPrefixLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {prefixSearchDate ? "No records found for the selected date" : "No history records found"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrefixLogs.map((log) => (
                  <div key={log.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="font-mono">
                        {log.prefix}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-2">
                      Updated by: {log.createdBy}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
