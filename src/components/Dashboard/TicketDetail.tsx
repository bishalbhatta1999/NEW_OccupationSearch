import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message } from 'antd';
import { MessageSquare } from 'lucide-react';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

interface Ticket {
  ticketNo: string;
  title: string;
  type: string;
  status: string;
  userId: string;
  agent: string;
  company: string;
  email: string;
  createdDate: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  authorName: string;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // -----------------------------------------
  // 1) Load the ticket doc in real-time
  // -----------------------------------------
  useEffect(() => {
    if (!ticketId) return;

    const ticketRef = doc(db, 'tickets', ticketId);
    const unsub = onSnapshot(ticketRef, (snapshot) => {
      if (snapshot.exists()) {
        setTicket(snapshot.data() as Ticket);
      } else {
        // If the doc doesn’t exist or was deleted
        setTicket(null);
      }
    });

    return () => unsub();
  }, [ticketId]);

  // -----------------------------------------
  // 2) Load comments subcollection in real-time
  // -----------------------------------------
  useEffect(() => {
    if (!ticketId) return;

    const commentsRef = collection(db, 'tickets', ticketId, 'comments');
    const unsub = onSnapshot(commentsRef, (snapshot) => {
      const fetched: Comment[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          authorName: data.authorName || 'Unknown',
        };
      });
      // Sort newest first
      fetched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setComments(fetched);
    });
    return () => unsub();
  }, [ticketId]);

  // -----------------------------------------
  // 3) Reopen ticket (set status="Open")
  // -----------------------------------------
  const handleReopen = async () => {
    if (!ticketId || !ticket) return;
    try {
      await updateDoc(doc(db, 'tickets', ticketId), { status: 'Open' });
      message.success('Ticket reopened!');
    } catch (err) {
      console.error('Error reopening ticket:', err);
      message.error('Could not reopen ticket. Try again.');
    }
  };

  // -----------------------------------------
  // 4) Add new comment to subcollection
  // -----------------------------------------
  const onAddComment = async (values: any) => {
    if (!ticketId) return;
    setLoading(true);

    if (!auth.currentUser) {
      message.error('You must be signed in to comment');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'tickets', ticketId, 'comments'), {
        content: values.comment.trim(),
        createdAt: Timestamp.now(),
        userId: auth.currentUser.uid,
        authorName: auth.currentUser?.displayName || 'Support User',
      });
      commentForm.resetFields();
    } catch (err) {
      console.error('Error adding comment:', err);
      message.error('Failed to add comment.');
    } finally {
      setLoading(false);
    }
  };

  // Edge cases
  if (!ticketId) {
    return <div>No Ticket ID specified.</div>;
  }
  if (ticket === null) {
    return <div>Loading ticket details...</div>;
  }
  if (!ticket) {
    return <div>Ticket not found or deleted.</div>;
  }

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Support Ticket Details</h2>
            <p className="text-sm text-gray-600">Ticket #{ticket.ticketNo}</p>
          </div>
        </div>
        <Button onClick={onBack} type="default">
          Back To Support List
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {ticket.title}
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2
                  ${
                    ticket.status === 'Open'
                      ? 'bg-green-100 text-green-800'
                      : ticket.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : ticket.status === 'Resolved'
                      ? 'bg-purple-100 text-purple-800'
                      : ticket.status === 'Closed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                <Button type="primary" onClick={handleReopen}>
                  Reopen Ticket
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Support Type</label>
                  <p className="text-gray-900">{ticket.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-gray-900">{ticket.createdDate}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-gray-900">{ticket.agent}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{ticket.email}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4">Comments & Updates</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {c.authorName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.authorName}</p>
                      <p className="text-sm text-gray-500">
                        {c.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 ml-10">{c.content}</p>
                </div>
              ))}
            </div>

            <Form form={commentForm} onFinish={onAddComment}>
              <Form.Item
                name="comment"
                rules={[{ required: true, message: 'Please enter your comment' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Add a comment..."
                  className="rounded-lg"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Comment
              </Button>
            </Form>
          </Card>
        </div>

        {/* Right Column: Additional Info */}
        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-4">Company Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-gray-900">{ticket.company}</p>
              </div>
              {/* Add more company-related fields if desired */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;