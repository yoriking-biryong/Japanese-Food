(function(root){
 'use strict';
 const valid=d=>Array.isArray(d)&&d.length===3&&d.every(n=>Number.isInteger(n)&&n>=1&&n<=200);
 class CutModel{
  constructor(dims){if(!valid(dims))throw new Error('치수는 1~200mm 정수여야 합니다.');this.pieces=[{id:1,dims:[...dims]}];this.active=1;this.next=2;this.history=[];this.cuts=0;}
  get piece(){return this.pieces.find(p=>p.id===this.active);}
  snapshot(){return JSON.stringify({pieces:this.pieces,active:this.active,next:this.next,cuts:this.cuts});}
  remember(){this.history.push(this.snapshot());if(this.history.length>80)this.history.shift();}
  rotate(axis){if(!['x','y','z'].includes(axis))throw new Error('회전축 오류');this.remember();const pairs={x:[1,2],y:[0,2],z:[0,1]},[a,b]=pairs[axis],d=this.piece.dims;[d[a],d[b]]=[d[b],d[a]];}
  cut(mm){const p=this.piece;if(!Number.isInteger(mm)||mm<=0||mm>=p.dims[0])throw new Error('칼은 재료 양끝 사이에 놓아 주세요.');if(this.pieces.length>=60)throw new Error('조각이 60개가 되었어요. 결과 확인 후 새 재료로 연습해 주세요.');this.remember();const rest=[...p.dims];rest[0]-=mm;p.dims[0]=mm;this.pieces.push({id:this.next++,dims:rest});this.cuts++;return this.pieces.at(-1);}
  select(id){if(this.pieces.some(p=>p.id===id))this.active=id;}
  undo(){if(!this.history.length)return false;Object.assign(this,JSON.parse(this.history.pop()));return true;}
  volume(){return this.pieces.reduce((sum,p)=>sum+p.dims.reduce((a,n)=>a*n,1),0);}
  fits(target,tolerance=1){if(!valid(target))return false;const a=[...this.piece.dims].sort((x,y)=>x-y),b=[...target].sort((x,y)=>x-y);return a.every((n,i)=>Math.abs(n-b[i])<=tolerance);}
 }
 root.CutModel=CutModel;
})(typeof window==='undefined'?globalThis:window);
