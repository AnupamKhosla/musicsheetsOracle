import React, {useState} from "react";
// import { H2 } from "@leafygreen-ui/typography";
// import Textinput from '@leafygreen-ui/text-input';
// import Textarea from "@leafygreen-ui/text-area";
// import FormFooter from "@leafygreen-ui/form-footer";
// import Toast from "@leafygreen-ui/toast";
// import { css } from "@leafygreen-ui/emotion";
import { baseUrl } from "../config";

// const formStyle = css`
//   height: 100vh;
//   min-width: 767px;
//   margin: 10px;

//   input {
//     margin-bottom: 20px;
//   }
// `

export default function App() {
  let [ author, setAuthor ] = useState("");
  let [ title, setTitle ] = useState("");
  let [ tags, setTags ] = useState("");
  let [ body, setBody ] = useState("");
  let [toastOpen, setToastOpen] = useState(false);

  const handleSubmit = async () => {    
    await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        author, title, tags: tags.split(","), body 
      }) //need work on this
    }).then(resp => console.log(resp.json()));
    setAuthor("");
    setTitle("");
    setTags("");
    setBody("");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  }

  return (
    <React.Fragment>
      <h2>Write New Post</h2>
      <form className="formStyle">
        <input
          label="Author"
          description="Enter your name"
          onChange={e => setAuthor(e.target.value)}
          value={author}
        />
        <input
          label="Title"
          description="Enter the title for this blog post"
          onChange={e => setTitle(e.target.value)}
          value={title}
        />
        <input
          label="Tags"
          description="Enter tags for the post, comma separated if multiple"
          onChange={e => setTags(e.target.value)}
          value={tags}
        />
        <textarea
          label="Post body"
          description="Write your article. Be creative and have fun!"
          onChange={e => setBody(e.target.value)}
          rows="10"
          value={body}
        />
        <button
          primaryButton={{
            text: 'Save Blog Post',
            onClick: handleSubmit
          }}
        />
      </form>

      <dialog
        variant="success"
        title="Post Created"
        body="Your blog post was successfully created."
        open={toastOpen}
        close={() => setToastOpen(false)}
      />
    </React.Fragment>
  )
}