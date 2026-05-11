import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface DailyReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'submitted';
  author: string;
  department: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  assignee: string;
  category: string;
  dueDate: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reportId?: string;
}

export const useDailyReportsStore = defineStore('dailyReports', () => {
  // State
  const reports = ref<DailyReport[]>([]);
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalReports = computed(() => reports.value.length);
  
  const completedTasks = computed(() => 
    tasks.value.filter(task => task.status === 'completed').length
  );
  
  const pendingTasks = computed(() => 
    tasks.value.filter(task => task.status === 'pending').length
  );

  const recentReports = computed(() => 
    reports.value
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  );

  const tasksByStatus = computed(() => {
    const statusCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0
    };
    
    tasks.value.forEach(task => {
      statusCounts[task.status]++;
    });
    
    return statusCounts;
  });

  const tasksByPriority = computed(() => {
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    
    tasks.value.forEach(task => {
      priorityCounts[task.priority]++;
    });
    
    return priorityCounts;
  });

  // Actions
  const fetchReports = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      reports.value = [
        {
          id: '1',
          title: 'Daily Report - Marketing Team',
          summary: 'Completed campaign analysis and lead generation activities',
          content: 'Today the marketing team focused on analyzing campaign performance and generating new leads. We reviewed Q4 metrics and planned upcoming initiatives.',
          date: '2024-01-15',
          status: 'completed',
          author: 'John Doe',
          department: 'Marketing',
          tasks: [],
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T17:00:00Z'
        },
        {
          id: '2',
          title: 'Daily Report - Development Team',
          summary: 'Bug fixes and feature implementation progress',
          content: 'Development team worked on critical bug fixes and implemented new features for the upcoming release. Code reviews and testing were also conducted.',
          date: '2024-01-15',
          status: 'in_progress',
          author: 'Jane Smith',
          department: 'Development',
          tasks: [],
          createdAt: '2024-01-15T09:30:00Z',
          updatedAt: '2024-01-15T16:30:00Z'
        }
      ];
    } catch (err) {
      error.value = 'Failed to fetch reports';
      console.error('Error fetching reports:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchTasks = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      tasks.value = [
        {
          id: '1',
          title: 'Update user documentation',
          description: 'Update the user documentation with new features',
          priority: 'medium',
          status: 'in_progress',
          assignee: 'John Doe',
          category: 'development',
          dueDate: '2024-01-20',
          tags: ['documentation', 'update'],
          notes: 'Focus on new API endpoints',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z'
        },
        {
          id: '2',
          title: 'Fix login bug',
          description: 'Resolve the login authentication issue reported by users',
          priority: 'high',
          status: 'completed',
          assignee: 'Jane Smith',
          category: 'development',
          dueDate: '2024-01-16',
          tags: ['bug', 'authentication'],
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z'
        },
        {
          id: '3',
          title: 'Design new landing page',
          description: 'Create mockups for the new landing page design',
          priority: 'medium',
          status: 'pending',
          assignee: 'Mike Wilson',
          category: 'design',
          dueDate: '2024-01-18',
          tags: ['design', 'landing-page'],
          createdAt: '2024-01-15T13:00:00Z',
          updatedAt: '2024-01-15T13:00:00Z'
        }
      ];
    } catch (err) {
      error.value = 'Failed to fetch tasks';
      console.error('Error fetching tasks:', err);
    } finally {
      loading.value = false;
    }
  };

  const createReport = async (reportData: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newReport: DailyReport = {
        ...reportData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      reports.value.unshift(newReport);
      return newReport;
    } catch (err) {
      error.value = 'Failed to create report';
      console.error('Error creating report:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      tasks.value.unshift(newTask);
      return newTask;
    } catch (err) {
      error.value = 'Failed to create task';
      console.error('Error creating task:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const taskIndex = tasks.value.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return tasks.value[taskIndex];
    } catch (err) {
      error.value = 'Failed to update task';
      console.error('Error updating task:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (taskId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      tasks.value = tasks.value.filter(task => task.id !== taskId);
    } catch (err) {
      error.value = 'Failed to delete task';
      console.error('Error deleting task:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getReportById = (id: string) => {
    return reports.value.find(report => report.id === id);
  };

  const getTaskById = (id: string) => {
    return tasks.value.find(task => task.id === id);
  };

  const getTasksByAssignee = (assignee: string) => {
    return tasks.value.filter(task => task.assignee === assignee);
  };

  const getTasksByCategory = (category: string) => {
    return tasks.value.filter(task => task.category === category);
  };

  // Initialize store
  const initializeStore = async () => {
    await Promise.all([
      fetchReports(),
      fetchTasks()
    ]);
  };

  return {
    // State
    reports,
    tasks,
    loading,
    error,
    
    // Getters
    totalReports,
    completedTasks,
    pendingTasks,
    recentReports,
    tasksByStatus,
    tasksByPriority,
    
    // Actions
    fetchReports,
    fetchTasks,
    createReport,
    createTask,
    updateTask,
    deleteTask,
    getReportById,
    getTaskById,
    getTasksByAssignee,
    getTasksByCategory,
    initializeStore
  };
});
