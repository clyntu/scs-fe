import { useState } from "react";
import PurchaseOrderForm from "../../components/PurchaseOrder/PurchaseOrderForm";
import ViewPurchaseOrder from "../../components/PurchaseOrder/ViewPurchaseOrder";
import type { PurchaseOrder } from "../../interface";

const PurchaseOrderMenu = (): JSX.Element => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PurchaseOrder | undefined>();
  const [currentViewFilters, setCurrentViewFilters] = useState<
    Record<string, any>
  >({});

  return (
    <div>
      {openCreate && (
        <PurchaseOrderForm
          setOpen={setOpenCreate}
          openCreate={openCreate}
          openEdit={openEdit}
          title="Create Purchase Order"
        />
      )}

      {openEdit && (
        <PurchaseOrderForm
          setOpen={setOpenEdit}
          openCreate={openCreate}
          openEdit={openEdit}
          selectedRow={selectedRow}
          title="Edit Purchase Order"
          setSelectedRow={setSelectedRow}
          viewFilters={currentViewFilters}
        />
      )}

      {!openEdit && !openCreate && (
        <ViewPurchaseOrder
          setOpenCreate={setOpenCreate}
          setOpenEdit={setOpenEdit}
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          onFiltersChange={setCurrentViewFilters}
        />
      )}
    </div>
  );
};

export default PurchaseOrderMenu;
