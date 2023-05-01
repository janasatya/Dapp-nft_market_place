import { useState,useEffect } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from"web3modal"
import {contractAddress,pinataApi} from "../../config"
import ABI from "../abi/MarketToken.json"
import axios from "axios";
import Image from "next/image";

export default function createNFT(){
    const [fileUrl,setFileUrl]=useState(null)
    const [fromInput,setFromInput]=useState({price:null,name:null,description:null})
    const router=useRouter();
    const[loading,setLoading]=useState("not-loading");


    //upload image to pinata
    async function imageUpload(e){
        const file=e.target.files[0];
        try{
            const formData=new FormData();
            formData.append("file",file);
            const resFile=await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers:{
                    'pinata_api_key':pinataApi.Key,
                    'pinata_secret_api_key':pinataApi.Secret,
                    'Content-Type':'multipart/form-data'
                },
            })
            // console.log(resFile);
            
            const imageUri=`https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
            setFileUrl(imageUri);

        }catch(err){
            console.log("error in uploading",err)
        }
    }

    async function uploadToIpfs(){
        const {price,name,description}=fromInput;
        if(!price || !name || !description || !fileUrl)return;
        setLoading("loading")
        try{
            var jsonData=JSON.stringify({
                "pinataMetdata":{
                    "name":`${name}.json`,
                    "pinataContent":{
                        name,description,image:fileUrl
                    }

                }
            })
            const resFile=await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: jsonData,
                headers:{
                    'pinata_api_key':pinataApi.Key,
                    'pinata_secret_api_key':pinataApi.Secret,
                    'Content-Type':'application/json'
                },
            })

            const tokenUri=`https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
            return tokenUri;
        }catch(err){
            console.log(err);
        }
    }

   async function createNft() {
       const tokenUrl= uploadToIpfs();
       const web3modal = new Web3Modal();
       const connection = await web3modal.connect();
       const provider = await new ethers.providers.Web3Provider(connection);
       const signer = await provider.getSigner();
       const getNetwork = await provider.getNetwork();
       if ((await getNetwork).chainId != 11155111) {
         alert("you not connected with sepolia network");
         return;
       }
       const contract = await new ethers.Contract(contractAddress, ABI.abi, signer);
    //    console.log(fromInput.price);
        const price = await ethers.utils.parseUnits(fromInput.price.toString(),'ether');
        console.log(price);
       let listingPrice=await contract.listingPrice();
       listingPrice=listingPrice.toString();
       const transaction=await contract.createToken(tokenUrl,price,{value:listingPrice})
       await transaction.wait();
       router.push('/');
   }


   return(
    <div className="flex justify-center">
        <div className="w-1/8 flex-col mr-10 mt-10">
            {
                !fileUrl && (
                    <Image alt="#" className="rounded mt-4" src="/calculator.png" width={200} height={200}/>
                )
            }
            {
                fileUrl && (
                    <Image src={fileUrl} alt="Image uploaded succesfully" width={200} height={200} placeholder="blur" blurDataURL="/calculator.png"/>
                )
            }
        </div>
        <div className="w-1/2 flex flex-col">
            <input type="text" placeholder="Asset Name" className="mt-8 border rounded p-4" onChange={e=>{setFromInput({...fromInput,name:e.target.value})}}/>
            <textarea name="" id="" placeholder="Asset Description" className="mt-2 border rounded p-4" onChange={e=>{setFromInput({...fromInput,description:e.target.value})}}></textarea>
            <input type="number" placeholder="Price of the asset" className="mt-2 border rounded p-4" onChange={e=>{setFromInput({...fromInput,price:e.target.value})}}/>
            <input type="file" name="Asset" id="" className="my-4" onChange={(e)=>{imageUpload(e)}}/>
            {
                fileUrl && (
                    <button onClick={createNft} className="font-bold mt-4 bg-orange-400 text-white rounded p-4 shadow-lg">
                        {
                            loading=="not-loading" ? "create NFT":"wait for Upload"
                        }
                    </button>
                )
            }
        </div>
    </div>
   )

}