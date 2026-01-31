import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Upload, FileText, Download, Trash2, Search, Filter, MessageSquare, Eye, Reply, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { ResponseDialog } from "../shared/dialogs/ResponseDialog";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PeerReviewDialog } from "../shared/dialogs/PeerReviewDialog";
import { AllFacultyFilesView } from "./AllFacultyFilesView";
import { mockCourseFiles, fileCategories, fileTypes } from "./mockData";
import { CourseFile } from "./types";

export function CourseFileManager() {
  const [files, setFiles] = useState<CourseFile[]>(mockCourseFiles);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState<"my-files" | "all-files">("my-files");
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mockFile: CourseFile = {
      id: Date.now().toString(),
      fileName: "NewFile_Example.pdf",
      courseCode: "CS101",
      courseName: "Introduction to Computer Science",
      fileType: selectedFileType,
      uploadDate: new Date().toISOString().split('T')[0],
      semester: semester,
      academicYear: selectedYear,
      size: "1.5 MB",
      facultyName: "Dr. Jane Smith",
      department: "Computer Science"
    };

    setFiles([mockFile, ...files]);
    setUploadDialogOpen(false);
    toast.success("File uploaded successfully");
    
    // Reset form
    setSelectedFileType("");
    setCourseName("");
    setSemester("");
    setSelectedYear(new Date().getFullYear().toString());
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast.success("File deleted successfully");
  };

  const handleDownload = (file: CourseFile) => {
    toast.success(`Downloading ${file.fileName}`);
  };

  const handleView = (file: CourseFile) => {
    setSelectedFile(file);
    setIsViewOpen(true);
  };

  const handleResponse = (response: string) => {
    if (!selectedFile) return;

    const updatedFiles = files.map(f =>
      f.id === selectedFile.id
        ? { ...f, facultyResponse: response, responseDate: new Date().toISOString().split('T')[0] }
        : f
    );
    setFiles(updatedFiles);

    setSelectedFile({
      ...selectedFile,
      facultyResponse: response,
      responseDate: new Date().toISOString().split('T')[0]
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || file.fileType === filterType;
    const matchesStatus = filterStatus === "all" || file.status === filterStatus;
    const matchesYear = filterYear === "all" || file.academicYear === filterYear;
    
    return matchesSearch && matchesType && matchesStatus && matchesYear;
  });

  const statuses = Array.from(new Set(files.map(f => f.status).filter(Boolean)));
  const years = Array.from(new Set(files.map(f => f.academicYear)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course File Management</CardTitle>
        <CardDescription>
          Upload and manage course materials, syllabi, lesson plans, and assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="my-files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-files">My Files</TabsTrigger>
            <TabsTrigger value="all-files">
              <Users className="h-4 w-4 mr-2" />
              All Faculty Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-files" className="space-y-4 mt-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {fileTypes.map((type:any) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status || "unknown"} value={status || "unknown"}>{status || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Course File</DialogTitle>
                    <DialogDescription>
                      Add a new course file to your repository
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="file">File</Label>
                      <Input
                        id="file"
                        type="file"
                        required
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">File Category *</Label>
                      <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)} required>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select file category" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileCategories.map((category:any) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="courseCode">Course Code</Label>
                      <Input
                        id="courseCode"
                        value="CS101"
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g., CS101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseName">Course Name</Label>
                      <Input
                        id="courseName"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g., Introduction to Computer Science"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fileType">File Type</Label>
                      <Select value={selectedFileType} onValueChange={(value) => setSelectedFileType(value)}>
                        <SelectTrigger id="fileType">
                          <SelectValue placeholder="Select file type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Syllabus">Syllabus</SelectItem>
                          <SelectItem value="Lesson Plan">Lesson Plan</SelectItem>
                          <SelectItem value="Assignment">Assignment</SelectItem>
                          <SelectItem value="Reading Material">Reading Material</SelectItem>
                          <SelectItem value="Presentation">Presentation</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={semester} onValueChange={(value) => setSemester(value)}>
                          <SelectTrigger id="semester">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fall">Fall</SelectItem>
                            <SelectItem value="Spring">Spring</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Input
                          id="academicYear"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          placeholder="2024-2025"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Upload File</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Files Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No files found. Upload your first course file to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>{file.fileName}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{file.courseCode}</div>
                            <div className="text-sm text-gray-500">{file.courseName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.fileType}</Badge>
                        </TableCell>
                        <TableCell>
                          {file.semester} {file.academicYear}
                        </TableCell>
                        <TableCell>{file.uploadDate}</TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(file)}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl">{files.length}</div>
                  <p className="text-sm text-gray-500">Total Files</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl">{fileTypes.length}</div>
                  <p className="text-sm text-gray-500">File Types</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl">{years.length}</div>
                  <p className="text-sm text-gray-500">Years</p>
                </CardContent>
              </Card>
            </div>

            {/* View File Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>File Details</DialogTitle>
                  <DialogDescription>
                    {selectedFile && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {selectedFile.fileName}
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                {selectedFile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Course Code</p>
                        <p>{selectedFile.courseCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Course Name</p>
                        <p>{selectedFile.courseName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">File Type</p>
                        <p>{selectedFile.fileType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Semester</p>
                        <p>{selectedFile.semester} {selectedFile.academicYear}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Upload Date</p>
                        <p>{selectedFile.uploadDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">File Size</p>
                        <p>{selectedFile.size}</p>
                      </div>
                    </div>

                    {/* Admin Review Section */}
                    {selectedFile.status && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-600" />
                            Admin Review
                          </h4>
                          <Badge 
                            className={
                              selectedFile.status === "Approved" 
                                ? "bg-green-100 text-green-800" 
                                : selectedFile.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {selectedFile.status}
                          </Badge>
                        </div>
                        
                        {selectedFile.adminRemarks ? (
                          <div className="space-y-3">
                            <Alert className={
                              selectedFile.status === "Approved" 
                                ? "border-green-200 bg-green-50" 
                                : selectedFile.status === "Rejected"
                                ? "border-red-200 bg-red-50"
                                : "border-yellow-200 bg-yellow-50"
                            }>
                              <AlertDescription>
                                <p className="text-sm mb-3">{selectedFile.adminRemarks}</p>
                                {selectedFile.reviewedBy && (
                                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                                    <p>Reviewed by: {selectedFile.reviewedBy}</p>
                                    {selectedFile.reviewedDate && (
                                      <p>Date: {selectedFile.reviewedDate}</p>
                                    )}
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>

                            {/* Faculty Response */}
                            {selectedFile.facultyResponse ? (
                              <Alert className="border-blue-200 bg-blue-50">
                                <AlertDescription>
                                  <p className="text-xs text-blue-800 mb-2">Your Response:</p>
                                  <p className="text-sm mb-3">{selectedFile.facultyResponse}</p>
                                  {selectedFile.responseDate && (
                                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                                      <p>Response Date: {selectedFile.responseDate}</p>
                                    </div>
                                  )}
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsResponseOpen(true)}
                                className="w-full"
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Respond to Admin Review
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Alert>
                            <AlertDescription className="text-sm text-gray-500">
                              This file is pending admin review. You will be notified once the review is complete.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => handleDownload(selectedFile)} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsViewOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Response Dialog */}
            <ResponseDialog
              open={isResponseOpen}
              onOpenChange={setIsResponseOpen}
              onSubmit={handleResponse}
              itemType="file"
            />
          </TabsContent>

          <TabsContent value="all-files" className="space-y-4 mt-4">
            <AllFacultyFilesView files={files} onFileUpdate={(updatedFile) => {
              const updated = files.map(f => f.id === updatedFile.id ? updatedFile : f);
              setFiles(updated);
            }} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
