
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mentor } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface MentorsTableProps {
  mentors: Mentor[];
  isLoading?: boolean;
}

export default function MentorsTable({ mentors, isLoading = false }: MentorsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground">
        No mentors found
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableCaption>List of mentors and their assigned sections</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Sections</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mentors.map((mentor) => (
            <TableRow key={mentor.id}>
              <TableCell className="font-medium">{mentor.name}</TableCell>
              <TableCell>{mentor.email}</TableCell>
              <TableCell>{mentor.contactNumber || 'Not provided'}</TableCell>
              <TableCell>{mentor.department || 'Not specified'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {mentor.sections && mentor.sections.length > 0 ? (
                    mentor.sections.map((section) => (
                      <Badge key={section} variant="outline" className="bg-blue-50">
                        {section}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">No sections</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
