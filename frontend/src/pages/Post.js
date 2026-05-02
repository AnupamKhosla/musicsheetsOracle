import React, {useState, useEffect, useRef} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { baseUrl } from "../config";
import OpenSheetMusicDisplay from "../components/OpenSheetMusicDisplay";

export default function App() {
  let params = useParams();
  let [post, setPost] = useState({});
  let [showModal, setShowModal] = useState(false);
  let [author, setAuthor] = useState("");
  let [body, setBody] = useState("");
  //let [password, setPassword] = useState("");
  let passwordRef = useRef();


  const navigate = useNavigate();

  const deletePost = async () => {    
    console.log(typeof(passwordRef.current.value));
    await fetch(`${baseUrl}/api/posts/${params.id}`, {
      method: "DELETE",
      body: {"pass": passwordRef.current.value} //IMPORTANT not working atm -- BUG
    }).then(resp => { 
      // stringify resp.body
      console.log(JSON.stringify(resp.body));
      if(resp.status !== 200) {
        alert("wrong password");         
      } 
      else {
        //return navigate("/");
      }
    });       
  }

  useEffect(() => {
    const loadPost = async () => {
      let results = await fetch(`${baseUrl}/api/posts/${params.id}`).then(resp => resp.json());      
      setPost(results);
    }
    loadPost();
  }, [params.id]);

  return (
    <React.Fragment>

      <div className="text-center mt-12">
          
          <h1 className="my-3 text-[26px] font-semibold">
            {post.sheetName}
          </h1>

          <ul className="list-none mt-6">
              <li className="inline-block font-semibold text-slate-400 mx-4">
                <span className="text-slate-900 dark:text-white block">Artists :</span> 
                <span className="block"> {post.Artist} </span>
              </li>
               <li className="inline-block font-semibold text-slate-400 mx-4"> 
                <span className="text-slate-900 dark:text-white block">Genre :</span> 
                <span className="block">{post.Genres}</span>
              </li>
               <li className="inline-block font-semibold text-slate-400 mx-4"> 
                <span className="text-slate-900 dark:text-white block">Scale :</span> 
                <span className="block">{post.scale}</span>
              </li>
              <li className="inline-block font-semibold text-slate-400 mx-4"> 
                <span className="text-slate-900 dark:text-white block">Published :</span>
                <span className="block">{(new Date(post.date)).toLocaleDateString()}</span>
              </li>
             
          </ul>
      </div>
   
      <section className="relative">
        <div className="container relative min-h-[40rem]">   
          { post.sheetName && <OpenSheetMusicDisplay file={"/sheets/" + post.sheetName + ".xml"} /> }
        </div>           
      </section>


      {/*<button variant="primary" onClick={() => setShowModal(true)}>Add Comment</button>&nbsp;&nbsp;*/}
      

      <div className="container flex items-center mb-5" >  
        <input className="text-sm py-1 px-3 me-2 mt-2 focus:border-rose-700 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline" 
          type="password"
          placeholder="Password"
          ref={passwordRef}
        />
        <button 
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle 
            transition duration-500 ease-in-out text-base text-center 
            bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 
            text-white rounded-md me-2 mt-2"
          variant="danger" 
          onClick={deletePost}>
            Delete sheet
        </button>  
        <a
          href={"/sheets/" + post.sheetName} 
          download
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-slate-600 hover:bg-slate-700 border-slate-600 hover:border-slate-700 text-white rounded-md me-2 mt-2">
          Download
        </a>           
      </div>


    </React.Fragment>
  )
}