import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../ui/button/button.component';
import { BadgeComponent } from '../../../ui/badge/badge.component';

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  salary: string;
  office: string;
  status: "Hired" | "In Progress" | "Pending";
  avatar: string;
}

@Component({
  selector: 'app-basic-table-three',
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './basic-table-three.component.html',
  styles: ``
})
export class BasicTableThreeComponent {

  employeeData: Employee[] = [
    {
      id: 1,
      name: "Lindsey Curtis",
      email: "lindsaycurtis@gmail.com",
      position: "Sales Assistant",
      salary: "$89,500",
      office: "Edinburgh",
      status: "Hired",
      avatar: "/images/user/user-01.jpg"
    },
    {
      id: 2,
      name: "Kaiya George",
      email: "kaiyageorge@gmail.com",
      position: "Chief Executive Officer",
      salary: "$120,000",
      office: "London",
      status: "In Progress",
      avatar: "/images/user/user-02.jpg"
    },
    {
      id: 3,
      name: "Zain Geidt",
      email: "zaingeidt@gmail.com",
      position: "Junior Technical Author",
      salary: "$120,000",
      office: "San Francisco",
      status: "In Progress",
      avatar: "/images/user/user-03.jpg"
    },
    {
      id: 4,
      name: "Abram Schleifer",
      email: "abramschleifer@gmail.com",
      position: "Software Engineer",
      salary: "$95,000",
      office: "New York",
      status: "Hired",
      avatar: "/images/user/user-04.jpg"
    },
    {
      id: 5,
      name: "Carlo George",
      email: "carlogeorge@gmail.com",
      position: "Integration Specialist",
      salary: "$80,000",
      office: "Chicago",
      status: "Pending",
      avatar: "/images/user/user-05.jpg"
    },
    {
      id: 6,
      name: "Phillip Curtis",
      email: "phillipcurtis@gmail.com",
      position: "Marketing Manager",
      salary: "$105,000",
      office: "Boston",
      status: "Hired",
      avatar: "/images/user/user-06.jpg"
    },
    {
      id: 7,
      name: "Tatiana Schleifer",
      email: "tatianaschleifer@gmail.com",
      position: "Developer",
      salary: "$115,000",
      office: "Austin",
      status: "In Progress",
      avatar: "/images/user/user-07.jpg"
    },
    {
      id: 8,
      name: "Marcus George",
      email: "marcusgeorge@gmail.com",
      position: "Product Designer",
      salary: "$92,000",
      office: "Seattle",
      status: "Pending",
      avatar: "/images/user/user-08.jpg"
    },
    {
      id: 9,
      name: "Emma Curtis",
      email: "emmacurtis@gmail.com",
      position: "Data Analyst",
      salary: "$88,000",
      office: "Denver",
      status: "Hired",
      avatar: "/images/user/user-09.jpg"
    },
    {
      id: 10,
      name: "Oliver Smith",
      email: "oliversmith@gmail.com",
      position: "Project Manager",
      salary: "$110,000",
      office: "Miami",
      status: "In Progress",
      avatar: "/images/user/user-10.jpg"
    },
    {
      id: 11,
      name: "Sophia Martinez",
      email: "sophiamartinez@gmail.com",
      position: "UX Designer",
      salary: "$97,000",
      office: "Portland",
      status: "Hired",
      avatar: "/images/user/user-11.jpg"
    },
    {
      id: 12,
      name: "James Wilson",
      email: "jameswilson@gmail.com",
      position: "DevOps Engineer",
      salary: "$125,000",
      office: "San Diego",
      status: "Pending",
      avatar: "/images/user/user-12.jpg"
    },
    {
      id: 13,
      name: "Isabella Brown",
      email: "isabellabrown@gmail.com",
      position: "Content Writer",
      salary: "$75,000",
      office: "Phoenix",
      status: "In Progress",
      avatar: "/images/user/user-13.jpg"
    },
    {
      id: 14,
      name: "Ethan Davis",
      email: "ethandavis@gmail.com",
      position: "QA Engineer",
      salary: "$85,000",
      office: "Dallas",
      status: "Hired",
      avatar: "/images/user/user-14.jpg"
    },
    {
      id: 15,
      name: "Mia Johnson",
      email: "miajohnson@gmail.com",
      position: "HR Manager",
      salary: "$90,000",
      office: "Atlanta",
      status: "Pending",
      avatar: "/images/user/user-15.jpg"
    },
    {
      id: 16,
      name: "Noah Garcia",
      email: "noahgarcia@gmail.com",
      position: "Financial Analyst",
      salary: "$95,000",
      office: "Houston",
      status: "Hired",
      avatar: "/images/user/user-16.jpg"
    },
    {
      id: 17,
      name: "Charlotte Lopez",
      email: "charlottelopez@gmail.com",
      position: "Social Media Manager",
      salary: "$78,000",
      office: "Las Vegas",
      status: "In Progress",
      avatar: "/images/user/user-17.jpg"
    },
    {
      id: 18,
      name: "Liam Rodriguez",
      email: "liamrodriguez@gmail.com",
      position: "Backend Developer",
      salary: "$118,000",
      office: "Nashville",
      status: "Pending",
      avatar: "/images/user/user-18.jpg"
    },
    {
      id: 19,
      name: "Amelia Lee",
      email: "amelialee@gmail.com",
      position: "Business Analyst",
      salary: "$93,000",
      office: "Philadelphia",
      status: "Hired",
      avatar: "/images/user/user-19.jpg"
    },
    {
      id: 20,
      name: "Benjamin White",
      email: "benjaminwhite@gmail.com",
      position: "Security Specialist",
      salary: "$105,000",
      office: "Columbus",
      status: "In Progress",
      avatar: "/images/user/user-20.jpg"
    }
  ];

  currentPage = 1;
  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 15, 20];
  searchQuery = '';
  selectedItems = new Set<number>();
  selectAll = false;

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  get filteredData(): Employee[] {
    if (!this.searchQuery.trim()) {
      return this.employeeData;
    }
    const query = this.searchQuery.toLowerCase();
    return this.employeeData.filter(employee =>
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.position.toLowerCase().includes(query) ||
      employee.office.toLowerCase().includes(query) ||
      employee.status.toLowerCase().includes(query)
    );
  }

  get currentItems(): Employee[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  get startEntry(): number {
    return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endEntry(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredData.length ? this.filteredData.length : end;
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.selectedItems.clear();
    this.selectAll = false;
  }

  onSearchChange() {
    this.currentPage = 1;
    this.selectedItems.clear();
    this.selectAll = false;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateSelectAllState();
    }
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.currentItems.forEach(item => this.selectedItems.add(item.id));
    } else {
      this.currentItems.forEach(item => this.selectedItems.delete(item.id));
    }
  }

  toggleSelectItem(id: number) {
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
    this.updateSelectAllState();
  }

  isSelected(id: number): boolean {
    return this.selectedItems.has(id);
  }

  updateSelectAllState() {
    this.selectAll = this.currentItems.length > 0 && 
                     this.currentItems.every(item => this.selectedItems.has(item.id));
  }

  handleDelete(employee: Employee) {
    console.log('Delete:', employee);
  }

  handleEdit(employee: Employee) {
    console.log('Edit:', employee);
  }

  downloadData() {
    console.log('Download data');
    // Implement download logic here
  }

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Hired') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'error';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 3;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (this.currentPage >= this.totalPages - 1) {
        pages.push(this.totalPages - 2, this.totalPages - 1, this.totalPages);
      } else {
        pages.push(this.currentPage - 1, this.currentPage, this.currentPage + 1);
      }
    }
    
    return pages;
  }
}
