import React, {useState, useEffect} from "react";
//import { H2 } from "@leafygreen-ui/typography";
import PostSummary from "../components/PostSummary";
import { baseUrl } from "../config";
import SearchForm from "../components/SearchForm";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPaginate from 'react-paginate';


function Items({ currentItems }) {
  return (
    <>
      {currentItems &&
        currentItems.map((post) => (          
            <PostSummary {...post} key={post._id} />          
        ))}
    </>
  );
}


export default function SearchResults() {
  const location = useLocation();
  let [posts, setPosts] = useState("empty");
  let [searchQuery, setSearchQuery] = useState(window.location.search);
  let results = {};
  let query = window.location.search;
  let navigate = useNavigate();
  let searchParams = new URLSearchParams(window.location.search);
  let results_per_page = 6; //this is same in posts.mjs baackend // FIXED
  let [result_total, set_result_total] = useState(5); //initial value 5; must be less than 6; will change after fetch
  const urlParams = new URLSearchParams(window.location.search);

  let res_heading = "Loading...";
  posts == "empty" ? res_heading = "Loading...": res_heading = "No results found";
  
  //const res_lim_start = (current_page - 1) * results_per_page;
  //const res_lim_end = current_page * results_per_page;
  //search query variable page value


  function PaginatedItems({ itemsPerPage }) {
    // Here we use item offsets; we could also use page offsets
    // following the API or data you're working with.
    //let initialoffSet = (urlParams.get('page') - 1)*itemsPerPage || 0;
    const [itemOffset, setItemOffset] = useState(0); //was using initialoffSet 
    // Simulate fetching items from another resources.
    // (This could be items from props; or items loaded in a local state
    // from an API endpoint with useEffect and useState)
    const endOffset = itemOffset + itemsPerPage;
    
    const pageCount = Math.ceil(result_total / itemsPerPage);

    // Invoke when user click to request another page.
    const handlePageClick = (event) => {
      console.log(event.selected);
      const newOffset = (event.selected * itemsPerPage) % result_total;
      console.log(
        `User requested page number ${event.selected}, which is offset ${newOffset}`
      );
      //setItemOffset(newOffset);
      
      
      searchParams = new URLSearchParams(window.location.search); //recalculate
      searchParams.set('page', event.selected+1);
      
      navigate(`/search?${searchParams.toString()}`); //this should trigger effect       
    };

    return (
      <>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
          <Items currentItems={posts} /> 
        </div>
        { 
          result_total > 6 && 
          <ReactPaginate
            forcePage={urlParams.get('page') != null ?  parseInt(urlParams.get('page')-1) : 0}
            nextLabel="next >"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={2}
            pageCount={pageCount}
            previousLabel="< previous"
            pageClassName="page-item"
            pageLinkClassName="page-link"
            previousClassName="page-item"
            previousLinkClassName="page-link"
            nextClassName="page-item"
            nextLinkClassName="page-link"
            breakLabel="..."
            breakClassName="page-item"
            breakLinkClassName="page-link"
            containerClassName="pagination flex gap-x-4 justify-center mt-8"
            activeClassName="active text-rose-600"
            renderOnZeroPageCount={null}
          />    
        }    
      </>
    );
  }



  let searchSubmitCallback = () => {
    //trigger useEffect
    //setPosts([]);
    setSearchQuery(window.location.search); //this will just cause rerender
  }


  useEffect(() => {  
    const loadPosts = async () => {
      //search get vars
      query = window.location.search; //reinitialize 
      //const current_page = urlParams.get('page') || 1;
      //use live url instead of searchQuery
      //when Navigation search happens searchQuery is not updated
      var tmp  = await fetch(`${baseUrl}/api/posts/count${query}`).then(resp => resp.json());
      set_result_total(tmp.count);
      results = await fetch(`${baseUrl}/api/posts${query}`).then(resp => resp.json());      
      setPosts(results);
    }
    loadPosts();
  }, [searchQuery, location.key]);
  return (



    <React.Fragment>
      <SearchForm searchSubmitCallback={searchSubmitCallback} />
      <div className="container relative my-16 min-h-[400px]">
          <h3 className="text-2xl font-bold text-center">
            {window.location.href.includes("?") ? "Search results" : "Search results"}
          </h3>          
           
            { 
              (posts == "empty" || posts.length == 0) ? (<span className="block mt-4 text-lg text-semibold text-center">{res_heading}</span>) :             
                <PaginatedItems itemsPerPage={results_per_page} />            
            }                 
      </div>    
    </React.Fragment>
  )
}


 /*<div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
              {posts.map(post => {
                return(
                  <PostSummary {...post} key={post._id} />
                )
              })}   
            </div> */