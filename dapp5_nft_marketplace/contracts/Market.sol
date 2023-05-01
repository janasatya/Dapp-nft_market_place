// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

 import "@openzeppelin/contracts/utils/Counters.sol" ;
 import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
 import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

 //"https://gateway.pinata.cloud/ipfs/QmYmQQguzZyXq95gx2jtBjYfyypKQTSN8nKtyforpwn2ZX"

contract MarketToken is ERC721URIStorage{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemSold;
    uint public listingPrice=0.0001 ether;
    address payable owner;
    constructor()ERC721("HeLlo Token","HTk"){
        owner=payable(msg.sender);
    }
    mapping(uint=>MarketItem) private idToMarketItem;

    struct MarketItem{
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    event MarketItemCreated(
        uint tokenId,
        address payable seller,
        address payable owner,
        uint price,
        bool sold
    );
    function setListingPrice(uint price)public {
        require(msg.sender==owner);
        listingPrice=price;
    }
    function createMarketItem(uint tokenId,uint price)private{
        require(price>0);
        idToMarketItem[tokenId]=MarketItem(
            tokenId,payable(msg.sender),payable(address(this)),price,false
        );
        _transfer(msg.sender, address(this), tokenId);
        emit MarketItemCreated(tokenId, payable(address(this)), payable(msg.sender), price, false);
    }

    function createToken(string memory tokenURI,uint price) payable public returns(uint){
        require(msg.value==listingPrice);
        _tokenIds.increment();
        uint id=_tokenIds.current();
        _mint(msg.sender, id);
        _setTokenURI(id, tokenURI);
        createMarketItem(id, price);
        owner.transfer(listingPrice);
        return id;
    }

    function buyNFT(uint id)public payable{
        require(id<=_tokenIds.current());
        uint price=idToMarketItem[id].price;
        address payable add=idToMarketItem[id].seller;
        require(price==msg.value);
        idToMarketItem[id].owner=payable(msg.sender);
        idToMarketItem[id].seller=payable(address(0));
        idToMarketItem[id].sold=true;
        _itemSold.increment();
        _transfer(address(this), msg.sender, id);
        add.transfer(price);
    }

    function fetchMarketItems()public view returns(MarketItem[] memory){
        uint itemCount=_tokenIds.current();
        uint unsoldCount=itemCount-_itemSold.current();
        MarketItem[] memory unsoldItems=new MarketItem[](unsoldCount);
        uint current=0;
        for(uint i=0;i<itemCount;i++){
            if(!idToMarketItem[i+1].sold){
                unsoldItems[current++]=idToMarketItem[i+1];
            }
        }
        return unsoldItems;
    }

    function fetchMyNFT()public view returns(MarketItem[] memory){
        uint count;
        for(uint i=0;i<_tokenIds.current();i++){
            if(idToMarketItem[i+1].seller==msg.sender){
                ++count;
            }
        }
        MarketItem[] memory myNft=new MarketItem[](count);
        uint j=0;
        for(uint i=0;i<_tokenIds.current();i++){
            if(idToMarketItem[i+1].seller==msg.sender){
                myNft[j++]=idToMarketItem[i+1];
            }
        }
        return myNft;
    }

    function resell(uint id,uint price)public payable{
        require(idToMarketItem[id].owner==msg.sender);
        require(msg.value==listingPrice);
        require(price>0);
        idToMarketItem[id].owner=payable(address(this));
        idToMarketItem[id].seller=payable(msg.sender);
        idToMarketItem[id].price=price;
        idToMarketItem[id].sold=false;
        owner.transfer(msg.value);
        _itemSold.decrement();
        _transfer(msg.sender, address(this), id);
    }

    function cancelToken(uint id)public{
        require(msg.sender==idToMarketItem[id].seller);
        require(idToMarketItem[id].sold==false);
        idToMarketItem[id].owner=payable(msg.sender);
        idToMarketItem[id].seller=payable(address(0));
        idToMarketItem[id].sold=true;
        _itemSold.increment();
        _transfer(address(this), msg.sender, id);
    }

}