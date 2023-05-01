import { useState,useEffect } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from"web3modal"
import {contractAddress,INFURA_URL} from "../../config"
import ABI from "../abi/MarketToken.json"
import axios from "axios";
import Image from "next/image";

export default function myNfts(){
    const [list,setList]=useState([]);
    const [loading,setLoading]=useState(true)
    const router=useRouter();
    const [webApi,setWebApi]=useState({signer:null,contract:null});
    useEffect(()=>{
        const load=async()=>{
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
       setWebApi({signer:signer,contract:contract});
    const data = await contract.fetchMyNFT();
    const items =await Promise.all (data.map(async (i) => {
      const id = i.tokenId;
      const tokenUri = await contract.tokenURI(id);
      let metadata = await axios.get(tokenUri);
      metadata=metadata.data.pinataMetdata.pinataContent;
      // console.log(metadata.image);
      let price = ethers.utils.formatUnits(i.price.toString(),"ether");
      let item = {
        price:price,
        tokenId: id,
        seller: i.seller,
        owner: i.owner,
        image: metadata.image,
        description: metadata.description
      }
      return item;
    }))
    setList(items);
    setLoading(false);
    }
        load();
    },[])

    const claimNft=async(item)=>{
      let id=item.tokenId;
      const {contract}=webApi;
      const transaction=await contract.cancelToken(id);
      await transaction.wait();
    }







    return (
        <div className="flex justify-center">
          <div className="px-4" style={{ maxWidth: "1600px" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-4">
              {
                list.map((nft, i) => (
                   (<div key={i} className="border shadow rounded-xl overflow-hidden m-3">
                    <Image  src={nft.image} alt="" width={300} height={200} placeholder="blur" blurDataURL="#" layout="responsive" />
                    <div className="p-4">
                      <p style={{ height: "15px" }} className="text-2xl font-semibold">{nft.name}</p>
                      <div className="text-grey-400">{nft.description}</div>
                    </div>
                    <div className="p-4 bg-black">
                      <p className="text-2xl mb-4 font-bold text-white">{nft.price}</p>
                    <button className="w-full bg-orange-400 text-white font-bold py-2 px-12 rounded" onClick={()=>{claimNft(nft)}}>Claim NFT</button>
                    </div>
                  </div>)
                ))
              }
            </div>
          </div>
    
        </div>
      )
}