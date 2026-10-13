import React, { useEffect, useState } from "react";
import List from "./List";
import Axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PaginationControls from "../../Common/PaginationControls";

const Form = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(null);
  const [newdate, setDate] = useState(null); // Initialize date as null
  const [calorieList, setCalorieList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pagination, setPagination] = useState(null);

  const addFood = (event) => {
    event.preventDefault();
    if (!name || amount === 0 || !newdate) {
      console.log("Please fill in all fields.");
      return;
    }

    // Convert the date to UTC
    // const utcDate = new Date(newdate);
    // const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
    // const istDateString = istDate.toISOString();

    // newdate.setTime(
    //   newdate.getTime() - new Date().getTimezoneOffset() * 60 * 1000
    // );

    // var myDate = new Date(newdate).toISOString();

    if (selectedItem) {
      // If an item is selected, it's an update
      Axios.patch(
        `/api/v1/nutrition-entries/${selectedItem._id}`,
        {
          foodName: name,
          calories: amount,
          date: newdate,
        }
      )
        .then((response) => {
          console.log(response);
          // Clearing the form and reset selected item
          setName("");
          setAmount(0);
          setSelectedItem(null);
          setRefreshKey((value) => value + 1);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      // If no item is selected, it's an add
      Axios.post("/api/v1/nutrition-entries", {
        foodName: name,
        calories: amount,
        date: newdate,
      })
        .then((response) => {
          console.log(response);
          setName("");
          setAmount(0);
          setPage(1);
          setRefreshKey((value) => value + 1);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  useEffect(() => {
    Axios.get(`/api/v1/nutrition-entries?page=${page}&limit=20`)
      .then((response) => {
        setCalorieList(response.data);
        setPagination(response.pagination);
        if (response.pagination?.totalPages > 0 && page > response.pagination.totalPages) {
          setPage(response.pagination.totalPages);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [page, selectedItem, refreshKey]);

  const deleteCalorie = (id) => {
    Axios.delete(`/api/v1/nutrition-entries/${id}`).then(() => {
      setCalorieList(calorieList.filter((val) => val._id !== id));
      setRefreshKey((value) => value + 1);
    });
  };

  return (
    // <div className="form max-w-sm mx-auto w-96">
    //   <h1 className="font-bold pb-4 text-xl"> Add Meal</h1>
    //   <form id="form" onSubmit={addFood}>
    //     <div className="grid gap-4">
    //       <div className="input-group">
    //         <input
    //           type="text"
    //           onChange={(e) => setName(e.target.value)}
    //           placeholder="Food name"
    //           value={name} //Bind
    //           className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
    //         />
    //       </div>
    //       <div className="input-group">
    //         <input
    //           type="text"
    //           onChange={(e) => setAmount(e.target.value)}
    //           placeholder="Calorie amount"
    //           value={amount}
    //           className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
    //           required
    //         />
    //       </div>

    //       <div className="input-group">
    //         <DatePicker
    //           selected={newdate}
    //           onChange={(newdate) => setDate(newdate)}
    //           placeholderText="Select Date"
    //           dateFormat="yyyy-MM-dd"
    //           isClearable
    //           filterDate={(d) => new Date() > d}
    //         />
    //       </div>
    //       <div>
    //         <button
    //           className="border py-2 text-white bg-green-400 w-full"
    //           type="submit"
    //         >
    //           {selectedItem ? "Update" : "Add"}
    //         </button>
    //         {selectedItem && (
    //           <button
    //             onClick={() => setSelectedItem(null)}
    //             className="border py-2 text-white bg-red-400 w-full mt-2"
    //           >
    //             Cancel Update
    //           </button>
    //         )}
    //       </div>
    //     </div>
    //   </form>
    //   <List
    //     calorieList={calorieList}
    //     deleteCalorie={deleteCalorie}
    //     setSelectedItem={setSelectedItem}
    //   />
    // </div>
    <div className="form max-w-sm mx-auto w-96">
      <h1 className="font-bold pb-4 text-xl"> Add Meal</h1>
      <form id="form" onSubmit={addFood}>
        <div className="grid gap-4">
          <div className="input-group">
            <input
              type="text"
              onChange={(e) => setName(e.target.value)}
              placeholder="Food name"
              value={name}
              className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
              // Additional styling classes can be added as needed
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Calorie content"
              value={amount}
              className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
              // Additional styling classes can be added as needed
              required
            />
          </div>
          <div className="input-group">
            <DatePicker
              selected={newdate}
              onChange={(newdate) => setDate(newdate)}
              placeholderText="Select Date"
              dateFormat="yyyy-MM-dd"
              isClearable
              filterDate={(d) => new Date() > d}
              className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-white rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              className="border py-2 text-white bg-green-400 w-full"
            >
              {selectedItem ? "Update" : "Add"}
            </button>
            {selectedItem && (
              <button
                onClick={() => setSelectedItem(null)}
                className="border py-2 text-white bg-red-400 w-full mt-2"
              >
                Cancel Update
              </button>
            )}
          </div>
        </div>
      </form>
      <List
        calorieList={calorieList}
        deleteCalorie={deleteCalorie}
        setSelectedItem={setSelectedItem}
      />
      <PaginationControls pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default Form;
