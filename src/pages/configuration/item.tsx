import { useEffect, useState } from "react";
import ItemsModal from "../../components/Items/ItemsModal";
import ViewWHModal from "../../components/Items/ViewWHModal";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { Input, Select, Option } from "@mui/joy";
import DeleteItemsModal from "../../components/Items/DeleteItemsModal";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { User } from "../Login";
import type { AxiosError } from "axios";
import type {
  Brand,
  Category,
  Item,
  PaginatedItems,
  PrintInventoryResponse,
} from "../../interface";
import {
  convertToQueryParams,
  addCommaToNumberWithFourPlaces,
} from "../../helper";
import { Pagination } from "@mui/material";
import { generatePricelistPDF } from "../../components/Items/generatePricelistPDF";
import { generateStocksPDF } from "../../components/Items/generateStocksPDF";

const PAGE_LIMIT = 10;

const ItemForm = (): JSX.Element => {
  const [items, setItems] = useState<PaginatedItems>({
    total: 0,
    items: [],
  });
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Item>();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isPrintingStocks, setIsPrintingStocks] = useState(false);
  const [isPrintingPricelist, setIsPrintingPricelist] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const getAllStocks = (page: number, searchTerm: string): void => {
    axiosInstance
      .get<PaginatedItems>(
        `/api/items/?${convertToQueryParams({
          page,
          limit: PAGE_LIMIT,
          sort_by: "id",
          sort_order: "desc",
          search_term: searchTerm,
          brand: selectedBrand,
          category: selectedCategory,
        })}`,
      )
      .then((response) => setItems(response.data))
      .catch((error) => console.error("Error:", error));
  };

  const changePage = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ): void => {
    setPage(value);
    getAllStocks(value, searchTerm);
  };

  useEffect(() => {
    // Fetch items
    getAllStocks(page, searchTerm);

    // Fetch categories
    axiosInstance
      .get<Category[]>(`/api/categories`)
      .then((response) => {
        setCategories(
          response.data.map((category) => category.normalized_name),
        );
      })
      .catch((error) => console.error("Error:", error));

    // Fetch brands
    axiosInstance
      .get<Brand[]>(`/api/brands`)
      .then((response) => {
        setBrands(response.data.map((brand) => brand.normalized_name));
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  const handleSaveItem = async (newItem: Item): Promise<void> => {
    const url = `/api/items/${newItem.id}`;

    const payload = {
      stock_code: newItem.stock_code,
      name: newItem.name,
      status: newItem.status,
      category: newItem.category,
      brand: newItem.brand,
      acquisition_cost: newItem.acquisition_cost,
      net_cost_before_tax: newItem.net_cost_before_tax,
      currency: newItem.currency,
      rate: newItem.rate,
      last_sale_price: newItem.last_sale_price,
      srp: newItem.srp,
    };

    const response = await axiosInstance.put(url, payload);
    setItems((prevItems) => ({
      ...prevItems,
      items: prevItems.items.map((item) =>
        item.id === response.data.id ? response.data : item,
      ),
    }));

    toast.success("Save successful!");
  };

  const handleCreateItem = async (newItem: Item): Promise<void> => {
    const payload = {
      stock_code: newItem.stock_code,
      name: newItem.name,
      status: newItem.status,
      category: newItem.category,
      brand: newItem.brand,
      acquisition_cost: newItem.acquisition_cost,
      net_cost_before_tax: newItem.net_cost_before_tax,
      currency: newItem.currency,
      rate: newItem.rate,
      last_sale_price: newItem.last_sale_price,
      srp: newItem.srp,
    };
    const response = await axiosInstance.post("/api/items/", payload);

    setItems((prevItems) => ({
      ...prevItems,
      items: [response.data, ...prevItems.items],
      total: prevItems.total + 1,
    }));

    toast.success("Save successful!");
  };

  const handleDeleteItem = async (): Promise<void> => {
    if (selectedRow !== undefined) {
      const url = `/api/items/${selectedRow.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("Delete successful!");
        setItems((prevItems) => ({
          ...prevItems,
          items: prevItems.items.filter((item) => item.id !== selectedRow.id),
          total: prevItems.total - 1,
        }));
      } catch (error) {
        console.error("Error:", error);
        if (isAxiosError(error)) {
          if (
            error.response?.status === 400 &&
            (error.response.data as any)?.detail ===
              "Cannot delete item with associated purchase orders."
          ) {
            toast.error("Cannot delete item with associated purchase orders.");
          } else {
            toast.error("An error occurred while deleting the item.");
          }
        } else {
          toast.error("An error occurred while deleting the item.");
        }
      }
    }
  };

  function isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError !== undefined;
  }

  const handleStocksPDFCreate = (): void => {
    // Fetch data
    setIsPrintingStocks(true);
    axiosInstance
      .get<PrintInventoryResponse>(
        `/api/inventory/?${convertToQueryParams({
          sort_by: "stock_code",
          sort_order: "asc",
          search_term: searchTerm,
          brand: selectedBrand,
          category: selectedCategory,
        })}`,
      )
      .then((response) => {
        console.log(response.data);
        const items = response.data.items;
        generateStocksPDF(items, "Peterson Parts Trading Inc.");
        setIsPrintingStocks(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsPrintingStocks(false);
      });
  };

  const handlePricelistPDFCreate = (): void => {
    // Fetch data
    setIsPrintingPricelist(true);
    axiosInstance
      .get<PaginatedItems>(
        `/api/items/?${convertToQueryParams({
          sort_by: "stock_code",
          sort_order: "asc",
          search_term: searchTerm,
          brand: selectedBrand,
          category: selectedCategory,
        })}`,
      )
      .then((response) => {
        const items = response.data.items;
        const data = items.map((item) => {
          return {
            availableQty: item.total_on_stock,
            stockCode: item.stock_code,
            stock: item.name,
            netCostTotal: addCommaToNumberWithFourPlaces(
              Number(item?.total_on_stock ?? 0) * Number(item.acquisition_cost),
            ),
          };
        });
        generatePricelistPDF(data, "Peterson Parts Trading Inc.");
        setIsPrintingPricelist(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsPrintingPricelist(true);
      });
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box className="flex justify-between mb-6">
          <h2>Stocks</h2>

          <div>
            <Button
              variant="soft"
              sx={{
                mr: 2,
                mt: 2,
                mb: 4,
                width: "140px",
              }}
              className="bg-button-soft-primary"
              onClick={handleStocksPDFCreate}
              loading={isPrintingStocks}
            >
              Print Stocks
            </Button>
            <Button
              variant="soft"
              sx={{
                mr: 2,
                mt: 2,
                mb: 4,
                width: "140px",
              }}
              className="bg-button-soft-primary"
              onClick={handlePricelistPDFCreate}
              loading={isPrintingPricelist}
            >
              Print Pricelist
            </Button>
            <Button
              sx={{
                mt: 2,
                mb: 4,
                width: "140px",
              }}
              className="bg-button-primary"
              color="primary"
              onClick={() => {
                setOpenAdd(true);
              }}
            >
              Add Stock
            </Button>
          </div>
        </Box>

        <Box className="flex items-center mb-6">
          <Input
            size="sm"
            placeholder="Stock Code or Description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            className="ml-4 w-[130px]"
            onChange={(event, value) => {
              if (value !== null) setSelectedCategory(value);
            }}
            size="sm"
            value={selectedCategory}
          >
            <Option value="">All</Option>
            {categories.map((category) => {
              return (
                <Option key={category} value={category}>
                  {category.toUpperCase()}
                </Option>
              );
            })}
          </Select>
          <Select
            className="ml-4 w-[130px]"
            onChange={(event, value) => {
              if (value !== null) setSelectedBrand(value);
            }}
            size="sm"
            value={selectedBrand}
          >
            <Option value="">All</Option>
            {brands.map((brand) => {
              return (
                <Option key={brand} value={brand}>
                  {brand.toUpperCase()}
                </Option>
              );
            })}
          </Select>
          <Button
            onClick={() => {
              getAllStocks(1, searchTerm);
            }}
            sx={{
              ml: 2,
              width: "80px",
            }}
            className="bg-button-primary"
            size="sm"
          >
            Search
          </Button>
        </Box>

        <Sheet
          sx={{
            "--TableCell-height": "40px",
            // the number is the amount of the header rows.
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "150px",
            "--Table-lastColumnWidth": "150px",
            // background needs to have transparency to show the scrolling shadows
            "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
            overflow: "auto",
            borderRadius: 8,
            background: (
              theme,
            ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
            linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
            radial-gradient(
              farthest-side at 0 50%,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(
                farthest-side at 100% 50%,
                rgba(0, 0, 0, 0.12),
                rgba(0, 0, 0, 0)
              )
              0 100%`,
            backgroundSize:
              "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local, local, scroll, scroll",
            backgroundPosition:
              "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
            backgroundColor: "background.surface",
            maxHeight: "600px",
          }}
        >
          <Table
            className="h-5"
            sx={{
              "& tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
              },
              "& tbody tr:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.015)", // Add hover effect
                cursor: "pointer", // Change cursor on hover
              },
            }}
            borderAxis="both"
          >
            <thead>
              <tr>
                <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                  Stock Code
                </th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 300 }}>Description</th>
                <th style={{ width: 100 }}>Category</th>
                <th style={{ width: 100 }}>Brand</th>
                <th style={{ width: 150 }}>Acquisition Cost (₱)</th>
                <th style={{ width: 200 }}>Net Cost B/F Tax (₱)</th>
                <th style={{ width: 150 }}>Last Sale Price (₱)</th>
                <th style={{ width: 200 }}>SRP (₱)</th>
                <th style={{ width: 100 }}>Currency</th>
                <th style={{ width: 150 }}>Peso Rate (₱)</th>
                <th style={{ width: 100 }}>On Stock</th>
                <th style={{ width: 100 }}>In Transit</th>
                <th style={{ width: 100 }}>Allocated</th>
                <th style={{ width: 100 }}>Purchased</th>
                <th style={{ width: 200 }}>Created By</th>
                <th style={{ width: 250 }}>Date Created</th>
                <th style={{ width: 200 }}>Modified By</th>
                <th style={{ width: 250 }}>Date Modified</th>
                <th
                  aria-label="last"
                  style={{ width: "var(--Table-lastColumnWidth)" }}
                />
              </tr>
            </thead>
            <tbody>
              {items.items.map((item) => (
                <tr
                  key={item.id}
                  onDoubleClick={() => {
                    setOpenEdit(true);
                    setSelectedRow(item);
                  }}
                >
                  <td>{item.stock_code}</td>
                  <td>{item.status}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.brand}</td>
                  <td>
                    {addCommaToNumberWithFourPlaces(item.acquisition_cost)}
                  </td>
                  <td>
                    {addCommaToNumberWithFourPlaces(item.net_cost_before_tax)}
                  </td>
                  <td>{addCommaToNumberWithFourPlaces(item.srp)}</td>
                  <td>
                    {addCommaToNumberWithFourPlaces(item.last_sale_price)}
                  </td>
                  <td>{item.currency}</td>
                  <td>{item.rate}</td>
                  <td>{item.total_on_stock}</td>
                  <td>{item.total_in_transit}</td>
                  <td>{item.total_allocated}</td>
                  <td>{item.total_purchased}</td>
                  <td>{item?.creator?.username}</td>
                  <td>{item.date_created}</td>
                  <td>{item?.modifier?.username}</td>
                  <td>{item.date_modified}</td>
                  <td>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="sm"
                        variant="plain"
                        color="neutral"
                        onClick={() => {
                          setOpenEdit(true);
                          setSelectedRow(item);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() => {
                          setOpenDelete(true);
                          setSelectedRow(item);
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      </Box>
      <Box className="flex align-center justify-end">
        <Pagination
          count={Math.floor(items.total / PAGE_LIMIT) + 1}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>
      <ItemsModal
        open={openAdd}
        setOpen={setOpenAdd}
        title="Add Stocks"
        onSave={handleCreateItem}
      />
      <ItemsModal
        open={openEdit}
        setOpen={setOpenEdit}
        title="Edit Stock"
        row={selectedRow}
        onSave={handleSaveItem}
      />
      <DeleteItemsModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Stock"
        onDelete={handleDeleteItem}
      />
    </>
  );
};

export default ItemForm;
