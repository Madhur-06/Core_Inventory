import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const typeConfig = {
  receipt: { label: 'Receipt', endpoint: 'receipts' },
  delivery: { label: 'Delivery Order', endpoint: 'deliveries' },
  transfer: { label: 'Internal Transfer', endpoint: 'transfers' },
  adjustment: { label: 'Stock Adjustment', endpoint: 'adjustments' },
};

function SortableLineItem({ id, line, idx, type, products, updateLine, removeLine, canRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-end bg-white dark:bg-gray-900 rounded-lg">
      <button type="button" {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        {idx === 0 && <label className="text-xs text-gray-500">Product</label>}
        <Select value={line.productId} onChange={(e) => updateLine(idx, 'productId', e.target.value)} required>
          <option value="">Select product</option>
          {products?.products?.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
          ))}
        </Select>
      </div>
      <div className="w-32">
        {idx === 0 && <label className="text-xs text-gray-500">{type === 'adjustment' ? 'Recorded' : 'Quantity'}</label>}
        <Input type="number" min="1" value={line.expectedQty} onChange={(e) => updateLine(idx, 'expectedQty', e.target.value)} required />
      </div>
      {type === 'adjustment' && (
        <div className="w-32">
          {idx === 0 && <label className="text-xs text-gray-500">Counted</label>}
          <Input type="number" min="0" value={line.actualQty} onChange={(e) => updateLine(idx, 'actualQty', e.target.value)} />
        </div>
      )}
      <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeLine(idx)} disabled={!canRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function OperationFormPage() {
  const { type } = useParams();
  const config = typeConfig[type];
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    supplierName: '',
    customerName: '',
    sourceLocationId: '',
    destinationLocationId: '',
    notes: '',
  });
  const [lines, setLines] = useState([{ productId: '', expectedQty: 1, actualQty: '' }]);

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then((r) => r.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((r) => r.data),
  });

  const allLocations = warehouses?.flatMap((w) =>
    w.locations.map((l) => ({ ...l, warehouseName: w.name }))
  ) || [];

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/operations/${config.endpoint}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      addToast(`${config.label} created`);
      navigate(`/operations/${type}s`);
    },
    onError: (err) => addToast(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed', 'error'),
  });

  const addLine = () => setLines([...lines, { productId: '', expectedQty: 1, actualQty: '' }]);

  const removeLine = (idx) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      lines: lines.map((l) => ({
        productId: l.productId,
        expectedQty: parseInt(l.expectedQty),
        ...(type === 'adjustment' && l.actualQty ? { actualQty: parseInt(l.actualQty) } : {}),
      })),
    };
    mutation.mutate(payload);
  };

  if (!config) return <div>Invalid operation type</div>;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIdx = lines.findIndex((_, i) => `line-${i}` === active.id);
      const newIdx = lines.findIndex((_, i) => `line-${i}` === over.id);
      setLines(arrayMove(lines, oldIdx, newIdx));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New {config.label}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Type-specific fields */}
            <div className="grid grid-cols-2 gap-4">
              {type === 'receipt' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier Name</label>
                    <Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destination Location *</label>
                    <Select value={form.destinationLocationId} onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })} required>
                      <option value="">Select location</option>
                      {allLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.warehouseName} → {l.name}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
              {type === 'delivery' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name</label>
                    <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source Location *</label>
                    <Select value={form.sourceLocationId} onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })} required>
                      <option value="">Select location</option>
                      {allLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.warehouseName} → {l.name}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
              {type === 'transfer' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source Location *</label>
                    <Select value={form.sourceLocationId} onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })} required>
                      <option value="">Select source</option>
                      {allLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.warehouseName} → {l.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destination Location *</label>
                    <Select value={form.destinationLocationId} onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })} required>
                      <option value="">Select destination</option>
                      {allLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.warehouseName} → {l.name}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
              {type === 'adjustment' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location *</label>
                  <Select value={form.sourceLocationId} onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })} required>
                    <option value="">Select location</option>
                    {allLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.warehouseName} → {l.name}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes <span className="text-xs font-normal text-muted-foreground">(Optional)</span></label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {/* Line Items with Drag & Drop */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Line Items</label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={lines.map((_, i) => `line-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {lines.map((line, idx) => (
                      <SortableLineItem
                        key={`line-${idx}`}
                        id={`line-${idx}`}
                        line={line}
                        idx={idx}
                        type={type}
                        products={products}
                        updateLine={updateLine}
                        removeLine={removeLine}
                        canRemove={lines.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : `Create ${config.label}`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
