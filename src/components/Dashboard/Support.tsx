import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Form, Card, Pagination, Modal, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { db, auth } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';

const { Option } = Select;

interface Ticket {
  key: string;         // Firestore doc ID
  ticketNo: string;
  title: string;
  type: string;
  status: string;      // default "Open"
  agent: string;       // "Full Name"
  company: string;     // auto-filled from user's account settings
  email: string;
  createdDate: string;
}

interface SupportProps {
  // If you have a detail page/route, you can handle navigation in onViewTicket.
  // If you do not need it, remove or comment out.
  onViewTicket?: (ticketId: string) => void;
}

/** Generate random ticketNo, e.g. "OSC280523321" */
const generateTicketNo = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const random = Math.floor(Math.random() * 900) + 100;
  return `OSC${day}${month}${year}${random}`;
};

const Support: React.FC<SupportProps> = ({ onViewTicket }) => {
  const [form] = Form.useForm();
  const [newTicketForm] = Form.useForm();

  // Full list of tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // Filtered list for table
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // "Create Ticket" modal
  const [newTicketModalVisible, setNewTicketModalVisible] = useState(false);

  // User and company data
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ---------------------------------------------------
  // 1) Load user and company data
  // ---------------------------------------------------
  useEffect(() => {
    const fetchUserAndCompanyData = async () => {
      if (auth.currentUser) {
        try {
          // Get the current user's doc from 'users'
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            console.log('No user document found');
            return;
          }

          const uData = userSnap.data();
          setUserData(uData);
          setIsSuperAdmin(uData.role === 'superAdmin');

          // If user doc doesn't have a companyId, default to user's own UID
          const companyId = uData.companyId || auth.currentUser.uid;

          // Attempt to read the 'companies' doc
          const companyRef = doc(db, 'companies', companyId);
          const companySnap = await getDoc(companyRef);

          if (companySnap.exists()) {
            setCompanyData(companySnap.data());
          } else {
            // No company doc found; handle gracefully
            console.log('No company document found');
            setCompanyData(null);
          }
        } catch (error) {
          console.error('Error fetching user or company data:', error);
        }
      }
    };
    fetchUserAndCompanyData();
  }, []);

  // ---------------------------------------------------
  // 2) Real-time listener for "tickets" collection
  // ---------------------------------------------------
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchUserAndTickets = async () => {
      try {
        // Get user's data first
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.error('User document not found');
          return;
        }
        const userData = userSnap.data();
        setIsSuperAdmin(userData.role === 'superAdmin');

        // Get company data
        const companyRef = doc(db, 'companies', userData.companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          setCompanyData(companySnap.data());
        }

        // Set up tickets listener
        const ticketsRef = collection(db, 'tickets');
        const q = userData.role === 'superAdmin'
          ? query(ticketsRef) // Super admin sees all tickets
          : query(ticketsRef, where('companyId', '==', userData.companyId)); // Others see only their company's tickets

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched: Ticket[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              key: docSnap.id,
              ticketNo: data.ticketNo,
              title: data.title,
              type: data.type,
              status: data.status,
              agent: data.agent,
              company: data.company,
              email: data.email,
              createdDate: data.createdDate || new Date().toLocaleString(),
            };
          });
          setTickets(fetched);
          setFilteredTickets(fetched);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error setting up tickets listener:', err);
      }
    };

    fetchUserAndTickets();
  }, [auth.currentUser]);

  // ---------------------------------------------------
  // 3) Define table columns
  // ---------------------------------------------------
  const columns = [
    {
      title: 'Ticket No',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Full Name',
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: 'Company Name',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Ticket) => (
        <Button type="link" onClick={() => onViewTicket?.(record.key)}>
          View
        </Button>
      ),
    },
  ];

  // ---------------------------------------------------
  // 4) Searching/Filtering
  // ---------------------------------------------------
  const onSearch = (values: any) => {
    const { supportType, supportStatus, searchText } = values;
    let filtered = [...tickets];

    // Filter by type if not "All"
    if (supportType && supportType !== 'All') {
      filtered = filtered.filter((t) => t.type === supportType);
    }
    // Filter by status if not "All"
    if (supportStatus && supportStatus !== 'All') {
      filtered = filtered.filter((t) => t.status === supportStatus);
    }
    // Filter by ticketNo or title if searchText provided
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticketNo.toLowerCase().includes(searchLower) ||
          t.title.toLowerCase().includes(searchLower)
      );
    }
    setFilteredTickets(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    form.resetFields();
    setFilteredTickets(tickets);
    setCurrentPage(1);
  };

  // ---------------------------------------------------
  // 5) Pagination
  // ---------------------------------------------------
  const handlePageChange = (page: number, pageSz?: number) => {
    setCurrentPage(page);
    if (pageSz) {
      setPageSize(pageSz);
    }
  };

  // ---------------------------------------------------
  // 6) Create a new ticket
  // ---------------------------------------------------
  const handleNewTicketSubmit = async (values: any) => {
    try {
      if (!auth.currentUser) {
        message.error('Please sign in to create a ticket');
        return;
      }

      // Get user's company data
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        message.error('User profile not found');
        return;
      }
      const userData = userSnap.data();
      
      // Get company data
      const companyRef = doc(db, 'companies', userData.companyId);
      const companySnap = await getDoc(companyRef);
      if (!companySnap.exists()) {
        message.error('Company data not found');
        return;
      }
      const companyData = companySnap.data();

      const ticketNo = generateTicketNo();
      const createdDate = new Date().toLocaleString();

      // Our new ticket doc
      const newTicket = {
        ticketNo,
        title: values.title,
        type: values.type,
        status: 'Open',
        userId: auth.currentUser.uid,
        companyId: userData.companyId,
        agent: values.fullName,
        company: companyData.name || '',
        email: values.email,
        createdDate,
        updatedAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid
      };

      // Add to Firestore
      await addDoc(collection(db, 'tickets'), newTicket);

      // Close the modal & reset form
      setNewTicketModalVisible(false);
      newTicketForm.resetFields();
      message.success('New ticket created successfully');

      // The new ticket immediately shows up in our table,
      // thanks to the real-time onSnapshot subscription.
    } catch (err) {
      console.error('Error creating ticket:', err);
      message.error('Failed to create ticket. Please try again.');
    }
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Support Tickets</h1>

      {/* Filter Form */}
      <Card>
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item label="All Support Type" name="supportType" initialValue="All">
            <Select style={{ width: 160 }}>
              <Option value="All">All</Option>
              <Option value="Fix Subscription">Fix Subscription</Option>
              <Option value="Technical Issue">Technical Issue</Option>
              <Option value="Billing">Billing</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item label="All Support Status" name="supportStatus" initialValue="All">
            <Select style={{ width: 160 }}>
              <Option value="All">All</Option>
              <Option value="Open">Open</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Resolved">Resolved</Option>
              <Option value="Closed">Closed</Option>
            </Select>
          </Form.Item>
          <Form.Item name="searchText">
            <Input
              placeholder="Search Ticket No or Title"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={resetFilters}>Reset</Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setNewTicketModalVisible(true)}
            >
              New Ticket
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Table of Tickets */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
          )}
          pagination={false}
          rowKey="ticketNo"
        />
        <div className="flex justify-between items-center mt-4">
          <span>
            Displaying {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredTickets.length)} of{' '}
            {filteredTickets.length} entries
          </span>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredTickets.length}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['5', '10', '25', '50']}
          />
        </div>
      </Card>

      {/* Modal: Create New Ticket */}
      <Modal
        title="Create New Ticket"
        open={newTicketModalVisible}
        onCancel={() => setNewTicketModalVisible(false)}
        onOk={() => newTicketForm.submit()}
        okText="Create Ticket"
      >
        <Form form={newTicketForm} layout="vertical" onFinish={handleNewTicketSubmit}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter ticket title" />
          </Form.Item>
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select placeholder="Select ticket type">
              <Option value="Fix Subscription">Fix Subscription</Option>
              <Option value="Technical Issue">Technical Issue</Option>
              <Option value="Billing">Billing</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your name" />
          </Form.Item>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter an email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Support;