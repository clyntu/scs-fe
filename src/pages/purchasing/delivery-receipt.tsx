import { useState } from "react";
import DeliveryReceiptForm from "../../components/DeliveryReceipt/DeliveryReceiptForm";
import ViewDeliveryReceipt from "../../components/DeliveryReceipt/ViewDeliveryReceipt";
import type { DeliveryReceipt } from "../../interface";

const DeliveryReceiptMenu = (): JSX.Element => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DeliveryReceipt | undefined>();
  const [currentViewFilters, setCurrentViewFilters] = useState<
    Record<string, any>
  >({});

  return (
    <div>
      {openCreate && (
        <DeliveryReceiptForm
          setOpen={setOpenCreate}
          openCreate={openCreate}
          openEdit={openEdit}
          title="Create Delivery Receipt"
        />
      )}

      {openEdit && (
        <DeliveryReceiptForm
          setOpen={setOpenEdit}
          openCreate={openCreate}
          openEdit={openEdit}
          selectedRow={selectedRow}
          title="Edit Delivery Receipt"
          setSelectedRow={setSelectedRow}
          viewFilters={currentViewFilters}
        />
      )}

      {!openEdit && !openCreate && (
        <ViewDeliveryReceipt
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

export default DeliveryReceiptMenu;
